'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import api from '@/lib/api';
import type { Alumno, Rutina } from '@/types';

export default function SeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [updatingPeso, setUpdatingPeso] = useState<{[key: string]: boolean}>({});
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<number>(1);
  const [pesosLocales, setPesosLocales] = useState<{[key: string]: number | null}>({});
  const debounceTimers = useRef<{[key: string]: NodeJS.Timeout}>({});

  const { data: alumno } = useQuery<Alumno>({
    queryKey: ['alumno', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/alumnos/${id}`);
      return response.data;
    },
  });

  const { data: seguimiento, isLoading } = useQuery<{
    alumno: Alumno;
    historialSemanas: any[];
    pesosPorSemana: { [semana: number]: { [dia: number]: { [bloque: number]: { [ejercicio: number]: number } } } };
    rutinaActual?: Rutina;
  }>({
    queryKey: ['seguimiento', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/seguimiento/${id}`);
      return response.data;
    },
  });

  // Calcular la última y primera semana disponible
  const ultimaSemana = useMemo(() => {
    if (!seguimiento) return 1;
    const semanasHistorial = seguimiento?.historialSemanas?.map((s: any) => s.numeroSemana) || [];
    const semanasPesos = Object.keys(seguimiento?.pesosPorSemana || {}).map(Number);
    const rutina = seguimiento?.rutinaActual;
    const semanaRutina = rutina?.semanaActual || 0;
    
    const todasLasSemanas = [...semanasHistorial, ...semanasPesos, semanaRutina].filter(s => s > 0);
    return todasLasSemanas.length > 0 ? Math.max(...todasLasSemanas) : 1;
  }, [seguimiento]);

  const primeraSemana = useMemo(() => {
    if (!seguimiento) return 1;
    const semanasHistorial = seguimiento?.historialSemanas?.map((s: any) => s.numeroSemana) || [];
    const semanasPesos = Object.keys(seguimiento?.pesosPorSemana || {}).map(Number);
    const rutina = seguimiento?.rutinaActual;
    const semanaRutina = rutina?.semanaActual || 0;
    
    const todasLasSemanas = [...semanasHistorial, ...semanasPesos, semanaRutina].filter(s => s > 0);
    return todasLasSemanas.length > 0 ? Math.min(...todasLasSemanas) : 1;
  }, [seguimiento]);

  // Inicializar con la última semana solo cuando se carga por primera vez
  const [haInicializado, setHaInicializado] = useState(false);
  useEffect(() => {
    if (ultimaSemana > 1 && !haInicializado && seguimiento) {
      setSemanaSeleccionada(ultimaSemana);
      setHaInicializado(true);
    }
  }, [ultimaSemana, haInicializado, seguimiento]);

  const updatePesoMutation = useMutation({
    mutationFn: async ({ 
      diaIndex, 
      bloqueIndex, 
      ejercicioIndex, 
      peso,
      numeroSemana
    }: { 
      diaIndex: number; 
      bloqueIndex: number; 
      ejercicioIndex: number; 
      peso: number | null;
      numeroSemana: number;
    }) => {
      const key = `${numeroSemana}-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
      setUpdatingPeso(prev => ({ ...prev, [key]: true }));
      
      try {
        const response = await api.put(
          `/api/profesor/seguimiento/${id}/ejercicio/${diaIndex}/${bloqueIndex}/${ejercicioIndex}/peso`,
          { peso, numeroSemana }
        );
        return response.data;
      } finally {
        setUpdatingPeso(prev => ({ ...prev, [key]: false }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguimiento', id] });
    },
  });

  const handlePesoChange = useCallback((
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    nuevoPeso: number | null,
    numeroSemana: number
  ) => {
    const key = `${numeroSemana}-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    
    // Actualizar estado local inmediatamente (sin perder focus)
    setPesosLocales(prev => ({ ...prev, [key]: nuevoPeso }));
    
    // Limpiar timer anterior si existe
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    
    // Crear nuevo timer con debounce de 800ms
    debounceTimers.current[key] = setTimeout(() => {
      const pesoFinal = nuevoPeso === null || nuevoPeso === 0 || isNaN(nuevoPeso) ? null : nuevoPeso;
      updatePesoMutation.mutate({
        diaIndex,
        bloqueIndex,
        ejercicioIndex,
        peso: pesoFinal,
        numeroSemana
      });
    }, 800);
  }, [updatePesoMutation]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const obtenerPesoEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    semana: number
  ): number | null => {
    const key = `${semana}-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    
    // Si hay un valor local (el usuario está editando), usar ese
    if (pesosLocales[key] !== undefined) {
      return pesosLocales[key];
    }
    
    // Si no, usar el valor del servidor
    const pesosSemana = seguimiento?.pesosPorSemana?.[semana];
    if (!pesosSemana) return null;
    const pesosDia = pesosSemana[diaIndex];
    if (!pesosDia) return null;
    const pesosBloque = pesosDia[bloqueIndex];
    if (!pesosBloque) return null;
    return pesosBloque[ejercicioIndex] ?? null;
  };
  
  // Sincronizar pesos locales cuando cambian los datos del servidor (solo si no hay edición en curso)
  useEffect(() => {
    if (!seguimiento?.pesosPorSemana) return;
    
    // Sincronizar solo los valores que no están siendo editados actualmente
    const nuevosPesos: {[key: string]: number | null} = {};
    Object.keys(seguimiento.pesosPorSemana).forEach(semana => {
      const semanaNum = Number(semana);
      const pesosSemana = seguimiento.pesosPorSemana[semanaNum];
      if (!pesosSemana) return;
      
      Object.keys(pesosSemana).forEach(diaIdx => {
        const diaNum = Number(diaIdx);
        const pesosDia = pesosSemana[diaNum];
        if (!pesosDia) return;
        
        Object.keys(pesosDia).forEach(bloqueIdx => {
          const bloqueNum = Number(bloqueIdx);
          const pesosBloque = pesosDia[bloqueNum];
          if (!pesosBloque) return;
          
          Object.keys(pesosBloque).forEach(ejercicioIdx => {
            const ejercicioNum = Number(ejercicioIdx);
            const key = `${semanaNum}-${diaNum}-${bloqueNum}-${ejercicioNum}`;
            // Solo actualizar si no hay un timer activo (no está siendo editado)
            if (!debounceTimers.current[key]) {
              nuevosPesos[key] = pesosBloque[ejercicioNum] ?? null;
            }
          });
        });
      });
    });
    
    setPesosLocales(prev => {
      const merged = { ...prev };
      Object.keys(nuevosPesos).forEach(key => {
        // Solo actualizar si no hay edición en curso
        if (!debounceTimers.current[key]) {
          merged[key] = nuevosPesos[key];
        }
      });
      return merged;
    });
  }, [seguimiento?.pesosPorSemana]);

  const calcularVolumen = (series: number, repeticiones: number, peso: number | null): number => {
    if (peso === null || peso === undefined) return 0;
    return series * repeticiones * peso;
  };

  // Organizar historial por ejercicio (debe estar antes de cualquier return)
  const historialPorEjercicio = useMemo(() => {
    if (!seguimiento?.historialSemanas) return {};

    const ejerciciosMap: { [ejercicioId: string]: Array<{ semana: number; peso: number; repeticiones: number; volumen: number; fecha: string }> } = {};

    seguimiento.historialSemanas
      .sort((a: any, b: any) => a.numeroSemana - b.numeroSemana) // Ordenar por semana
      .forEach((semana: any) => {
        semana.dias?.forEach((dia: any) => {
          dia.ejercicios?.forEach((ejercicio: any) => {
            const ejercicioId = ejercicio.ejercicioId || 'desconocido';
            if (!ejerciciosMap[ejercicioId]) {
              ejerciciosMap[ejercicioId] = [];
            }
            ejerciciosMap[ejercicioId].push({
              semana: semana.numeroSemana,
              peso: ejercicio.pesoReal,
              repeticiones: ejercicio.repeticionesReal,
              volumen: ejercicio.volumenReal,
              fecha: dia.fecha
            });
          });
        });
      });

    return ejerciciosMap;
  }, [seguimiento?.historialSemanas]);

  // Calcular datos derivados (antes del return condicional)
  const rutina = seguimiento?.rutinaActual;
  const pesosPorSemana = seguimiento?.pesosPorSemana || {};
  const semanasHistorial = seguimiento?.historialSemanas?.map((s: any) => s.numeroSemana) || [];
  const semanasPesos = Object.keys(pesosPorSemana).map(Number);
  const ultimaSemanaConDatos = Math.max(...[...semanasHistorial, ...semanasPesos], 0);
  const todasLasSemanas = rutina 
    ? Array.from({ length: Math.max(ultimaSemanaConDatos, rutina.semanaActual || 1) }, (_, i) => i + 1)
    : [...new Set([...semanasHistorial, ...semanasPesos])].sort((a, b) => b - a); // Orden inverso (última primero)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link href={`/profesor/alumnos/${id}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver al alumno
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Seguimiento {alumno && `- ${alumno.nombre}`}
        </h1>
        <p className="mt-2 text-gray-600">
          Visualiza y edita los pesos del alumno por semana y día
        </p>
      </div>

      {/* Selector de semana */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSemanaSeleccionada(Math.max(primeraSemana, semanaSeleccionada - 1))}
            disabled={semanaSeleccionada <= primeraSemana}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden md:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              Semana {semanaSeleccionada}
            </h2>
            {semanaSeleccionada === ultimaSemana && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Actual
              </span>
            )}
          </div>

          <button
            onClick={() => setSemanaSeleccionada(Math.min(ultimaSemana, semanaSeleccionada + 1))}
            disabled={semanaSeleccionada >= ultimaSemana}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span className="hidden md:inline">Siguiente</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {rutina && todasLasSemanas.length > 0 ? (
        <div className="space-y-6">
          {todasLasSemanas.filter(s => s === semanaSeleccionada).map((numeroSemana) => {
            const semanaHistorial = seguimiento?.historialSemanas?.find(s => s.numeroSemana === numeroSemana);
            const pesosSemana = pesosPorSemana[numeroSemana] || {};

            return (
              <div key={numeroSemana} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    Semana {numeroSemana}
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Mostrar TODA la rutina con posibilidad de editar pesos */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Rutina - Pesos por Día
                    </h3>
                    <div className="space-y-4">
                      {rutina.dias.map((dia: any, diaIndex: number) => {
                        return (
                          <div key={diaIndex} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                              {dia.nombre} (Día {diaIndex + 1})
                            </h4>
                            <div className="space-y-4">
                              {dia.bloques.map((bloque: any, bloqueIndex: number) => {
                                return (
                                  <div key={bloqueIndex} className="ml-4 border-l-2 border-blue-200 pl-4">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                                      {bloque.nombre}
                                    </h5>
                                    <div className="space-y-2">
                                      {bloque.ejercicios.map((ejercicio: any, ejercicioIndex: number) => {
                                        const peso = obtenerPesoEjercicio(diaIndex, bloqueIndex, ejercicioIndex, numeroSemana);
                                        const volumen = calcularVolumen(ejercicio.series, ejercicio.repeticiones, peso);
                                        const key = `${numeroSemana}-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                                        const isUpdating = updatingPeso[key] || false;

                                        return (
                                          <div key={ejercicioIndex} className="bg-gray-50 rounded p-3 text-sm">
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="font-medium text-gray-900">
                                                {ejercicio.nombre}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {ejercicio.series} series × {ejercicio.repeticiones} reps
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                              <div>
                                                <label className="text-gray-500 text-xs">Peso (kg):</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    value={peso ?? ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                                      handlePesoChange(diaIndex, bloqueIndex, ejercicioIndex, value, numeroSemana);
                                                    }}
                                                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Sin definir"
                                                  />
                                                  <span className="text-gray-500 text-xs">kg</span>
                                                </div>
                                              </div>
                                              <div>
                                                <span className="text-gray-500 text-xs">Volumen:</span>
                                                <span className="ml-2 font-semibold text-green-600">
                                                  {volumen.toLocaleString()} kg
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-gray-500 text-xs">Pausa:</span>
                                                <span className="ml-2 font-semibold">
                                                  {ejercicio.pausa}s
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mostrar historial de progreso registrado por ejercicio */}
                  {Object.keys(historialPorEjercicio).length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Progreso Registrado (Historial) - Evolución por Ejercicio
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(historialPorEjercicio)
                          .sort((a, b) => a[0].localeCompare(b[0])) // Ordenar por nombre del ejercicio
                          .map(([ejercicioId, registros]) => (
                            <div key={ejercicioId} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-3">
                                {ejercicioId}
                              </h4>
                              <div className="space-y-2">
                                {registros
                                  .sort((a, b) => a.semana - b.semana) // Ordenar por semana
                                  .map((registro, index) => (
                                    <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                          <span className="font-medium text-blue-600">
                                            Semana {registro.semana}
                                          </span>
                                          <span className="text-gray-500 text-xs">
                                            {new Date(registro.fecha).toLocaleDateString('es-ES', {
                                              day: 'numeric',
                                              month: 'short'
                                            })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div>
                                            <span className="text-gray-500 text-xs">Peso:</span>
                                            <span className="ml-2 font-semibold text-blue-600">
                                              {registro.peso} kg
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 text-xs">Reps:</span>
                                            <span className="ml-2 font-semibold">
                                              {registro.repeticiones}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 text-xs">Volumen:</span>
                                            <span className="ml-2 font-semibold text-green-600">
                                              {registro.volumen?.toLocaleString()} kg
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {/* Mostrar progresión si hay más de un registro */}
                                      {index > 0 && (
                                        <div className="mt-2 text-xs">
                                          {registro.peso > registros[index - 1].peso ? (
                                            <span className="text-green-600">
                                              ↑ +{(registro.peso - registros[index - 1].peso).toFixed(1)} kg vs semana anterior
                                            </span>
                                          ) : registro.peso < registros[index - 1].peso ? (
                                            <span className="text-red-600">
                                              ↓ {(registro.peso - registros[index - 1].peso).toFixed(1)} kg vs semana anterior
                                            </span>
                                          ) : (
                                            <span className="text-gray-500">
                                              Sin cambio vs semana anterior
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">El alumno no tiene una rutina asignada</p>
        </div>
      )}
    </div>
  );
}
