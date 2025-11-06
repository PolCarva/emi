'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Rutina } from '@/types';

interface DiaProgreso {
  fecha: string;
  observaciones?: string;
  ejercicios: Array<{
    ejercicioId: string;
    pesoReal: number;
    repeticionesReal: number;
    volumenReal: number;
  }>;
}

interface SemanaProgreso {
  numeroSemana: number;
  dias: DiaProgreso[];
}

export default function AlumnoRutinaPage() {
  const queryClient = useQueryClient();
  const [updatingPeso, setUpdatingPeso] = useState<{[key: string]: boolean}>({});
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<number>(1);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(0);
  const [pesosLocales, setPesosLocales] = useState<{[key: string]: number | null}>({});
  const debounceTimers = useRef<{[key: string]: NodeJS.Timeout}>({});

  const { data: rutina, isLoading, error } = useQuery<Rutina>({
    queryKey: ['rutina-alumno'],
    queryFn: async () => {
      const response = await api.get('/api/alumno/rutina');
      return response.data;
    },
  });

  const { data: progreso } = useQuery<SemanaProgreso[]>({
    queryKey: ['progreso-alumno'],
    queryFn: async () => {
      const response = await api.get('/api/alumno/progreso');
      return response.data;
    },
  });

  // Obtener pesos de la semana seleccionada
  const { data: pesosSemana } = useQuery<{[key: string]: number}>({
    queryKey: ['pesos-semana', semanaSeleccionada],
    queryFn: async () => {
      const response = await api.get(`/api/alumno/rutina/pesos/${semanaSeleccionada}`);
      return response.data;
    },
    enabled: !!semanaSeleccionada,
  });

  // Calcular semana y día actual basado en el progreso
  const calcularSemanaYDiaActual = useMemo(() => {
    if (!progreso || !rutina || progreso.length === 0) {
      return { semana: rutina?.semanaActual || 1, dia: 0 };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Encontrar la última semana con días registrados
    const semanasConDias = progreso
      .filter(s => s.dias && s.dias.length > 0)
      .sort((a, b) => b.numeroSemana - a.numeroSemana);

    if (semanasConDias.length === 0) {
      return { semana: rutina.semanaActual || 1, dia: 0 };
    }

    // Obtener la última semana
    const ultimaSemana = semanasConDias[0];
    
    // Obtener el último día registrado
    const ultimoDiaCompletado = ultimaSemana.dias
      .map(d => ({
        fecha: new Date(d.fecha),
        dia: d
      }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];

    if (!ultimoDiaCompletado) {
      return { semana: rutina.semanaActual || 1, dia: 0 };
    }

    // Si el último día completado fue hace menos de 7 días, estamos en esa semana
    const diasDesdeUltimoDia = Math.floor((hoy.getTime() - ultimoDiaCompletado.fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasDesdeUltimoDia < 7) {
      // Estamos en la última semana registrada
      // Buscar el índice del último día de la rutina que se completó
      // Por simplicidad, asumimos que si hay N días registrados, el siguiente día es N
      // Pero si N >= días de rutina, volvemos al día 0 (siguiente semana)
      const diasRutina = rutina.dias.length;
      const diasCompletadosEnSemana = ultimaSemana.dias.length;
      
      // Si el número de días completados es menor que los días de la rutina,
      // el siguiente día es el que sigue al último completado
      // Si completamos todos los días (o al menos el último día de la rutina),
      // avanzamos al día 0 de la siguiente semana
      if (diasCompletadosEnSemana < diasRutina) {
        return { semana: ultimaSemana.numeroSemana, dia: diasCompletadosEnSemana };
      } else {
        // Completamos todos los días (o al menos el último), semana terminada
        return { semana: ultimaSemana.numeroSemana + 1, dia: 0 };
      }
    } else {
      // Pasaron 7 o más días desde el último día, estamos en una nueva semana
      return { semana: ultimaSemana.numeroSemana + 1, dia: 0 };
    }
  }, [progreso, rutina]);

  // Actualizar semana y día seleccionados cuando se calcula la actual
  useEffect(() => {
    if (calcularSemanaYDiaActual.semana && semanaSeleccionada === 1 && diaSeleccionado === 0) {
      setSemanaSeleccionada(calcularSemanaYDiaActual.semana);
      setDiaSeleccionado(calcularSemanaYDiaActual.dia);
    }
  }, [calcularSemanaYDiaActual]);

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
      const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
      setUpdatingPeso(prev => ({ ...prev, [key]: true }));
      
      try {
        const response = await api.put(
          `/api/alumno/rutina/ejercicio/${diaIndex}/${bloqueIndex}/${ejercicioIndex}/peso`,
          { peso, numeroSemana }
        );
        return response.data;
      } finally {
        setUpdatingPeso(prev => ({ ...prev, [key]: false }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutina-alumno'] });
      queryClient.invalidateQueries({ queryKey: ['pesos-semana', semanaSeleccionada] });
    },
  });

  const handlePesoChange = useCallback((
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    nuevoPeso: number | null
  ) => {
    const key = `${semanaSeleccionada}-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    
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
        numeroSemana: semanaSeleccionada
      });
    }, 800);
  }, [updatePesoMutation, semanaSeleccionada]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Función para obtener el peso de un ejercicio para la semana/día actual
  const obtenerPesoEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number
  ): number | null => {
    const clave = `${semanaSeleccionada}-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    
    // Si hay un valor local (el usuario está editando), usar ese
    if (pesosLocales[clave] !== undefined) {
      return pesosLocales[clave];
    }
    
    // Si no, usar el valor del servidor
    // Si no hay datos de pesos para la semana, retornar null
    if (!pesosSemana || Object.keys(pesosSemana).length === 0) {
      return null;
    }
    // Solo retornar el peso si existe la clave exacta, no usar fallback
    return pesosSemana.hasOwnProperty(clave) ? pesosSemana[clave] : null;
  };

  // Limpiar pesos locales cuando cambia la semana seleccionada
  useEffect(() => {
    // Limpiar todos los timers de la semana anterior
    Object.keys(debounceTimers.current).forEach(key => {
      if (!key.startsWith(`${semanaSeleccionada}-`)) {
        clearTimeout(debounceTimers.current[key]);
        delete debounceTimers.current[key];
      }
    });
    
    // Limpiar pesos locales que no pertenecen a la semana actual
    setPesosLocales(prev => {
      const filtered: {[key: string]: number | null} = {};
      Object.keys(prev).forEach(key => {
        if (key.startsWith(`${semanaSeleccionada}-`)) {
          filtered[key] = prev[key];
        }
      });
      return filtered;
    });
  }, [semanaSeleccionada]);

  // Sincronizar pesos locales cuando cambian los datos del servidor (solo si no hay edición en curso)
  useEffect(() => {
    if (!pesosSemana || Object.keys(pesosSemana).length === 0) return;
    
    // Sincronizar solo los valores que no están siendo editados actualmente
    const nuevosPesos: {[key: string]: number | null} = {};
    Object.keys(pesosSemana).forEach(key => {
      // Solo actualizar si no hay un timer activo (no está siendo editado)
      if (!debounceTimers.current[key]) {
        nuevosPesos[key] = pesosSemana[key] ?? null;
      }
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
  }, [pesosSemana]);

  const calcularVolumen = (series: number, repeticiones: number, peso: number | null): number => {
    if (peso === null || peso === undefined) return 0;
    return series * repeticiones * peso;
  };

  const irSemanaAnterior = () => {
    if (semanaSeleccionada > 1) {
      const nuevaSemana = semanaSeleccionada - 1;
      setSemanaSeleccionada(nuevaSemana);
      setDiaSeleccionado(0); // Resetear al primer día
      // Invalidar query de pesos para recargar
      queryClient.invalidateQueries({ queryKey: ['pesos-semana', nuevaSemana] });
    }
  };

  const irSemanaSiguiente = () => {
    const nuevaSemana = semanaSeleccionada + 1;
    setSemanaSeleccionada(nuevaSemana);
    setDiaSeleccionado(0); // Resetear al primer día
    // Invalidar query de pesos para recargar
    queryClient.invalidateQueries({ queryKey: ['pesos-semana', nuevaSemana] });
  };

  const irDiaAnterior = () => {
    if (diaSeleccionado > 0) {
      setDiaSeleccionado(diaSeleccionado - 1);
    } else {
      // Si estamos en el día 0, ir a la semana anterior y último día
      if (semanaSeleccionada > 1) {
        setSemanaSeleccionada(semanaSeleccionada - 1);
        if (rutina) {
          setDiaSeleccionado(rutina.dias.length - 1);
        }
      }
    }
  };

  const irDiaSiguiente = () => {
    if (rutina && diaSeleccionado < rutina.dias.length - 1) {
      setDiaSeleccionado(diaSeleccionado + 1);
    } else {
      // Si estamos en el último día, ir a la siguiente semana y día 0
      setSemanaSeleccionada(semanaSeleccionada + 1);
      setDiaSeleccionado(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !rutina) {
    return (
      <div className="px-4 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">No tienes una rutina asignada todavía.</p>
          <p className="text-sm text-yellow-600 mt-2">Contacta a tu profesor para que te asigne una rutina.</p>
        </div>
      </div>
    );
  }

  const diaActual = rutina.dias[diaSeleccionado];

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{rutina.nombre}</h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Objetivo</p>
            <p className="text-lg font-semibold text-gray-900">{rutina.objetivo}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Nivel</p>
            <p className="text-lg font-semibold text-gray-900">{rutina.nivel}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Semana</p>
              {semanaSeleccionada === calcularSemanaYDiaActual.semana && (
                <span className="text-xs text-green-600 font-medium">Actual</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={irSemanaAnterior}
                disabled={semanaSeleccionada <= 1}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Semana anterior"
              >
                ←
              </button>
              <p className="text-lg font-semibold text-gray-900 flex-1 text-center">
                {semanaSeleccionada}
              </p>
              <button
                onClick={irSemanaSiguiente}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Semana siguiente"
              >
                →
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Día</p>
              {semanaSeleccionada === calcularSemanaYDiaActual.semana && 
               diaSeleccionado === calcularSemanaYDiaActual.dia && (
                <span className="text-xs text-green-600 font-medium">Actual</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={irDiaAnterior}
                disabled={diaSeleccionado === 0 && semanaSeleccionada === 1}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Día anterior"
              >
                ←
              </button>
              <p className="text-lg font-semibold text-gray-900 flex-1 text-center">
                {diaSeleccionado + 1}
              </p>
              <button
                onClick={irDiaSiguiente}
                disabled={diaSeleccionado === rutina.dias.length - 1}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Día siguiente"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mostrar solo el día seleccionado */}
      {diaActual && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">{diaActual.nombre}</h2>
            <p className="text-blue-100 text-sm mt-1">
              Semana {semanaSeleccionada} - Día {diaSeleccionado + 1} de {rutina.dias.length}
            </p>
          </div>
          <div className="p-6 space-y-6">
            {diaActual.bloques.map((bloque, bloqueIndex) => (
              <div key={bloqueIndex}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{bloque.nombre}</h3>
                <div className="space-y-4">
                  {bloque.ejercicios.map((ejercicio, ejercicioIndex) => {
                    const key = `${diaSeleccionado}-${bloqueIndex}-${ejercicioIndex}`;
                    const isUpdating = updatingPeso[key] || false;
                    // Obtener peso de la semana/día actual (sin fallback a rutina)
                    const pesoEjercicio = obtenerPesoEjercicio(diaSeleccionado, bloqueIndex, ejercicioIndex);
                    const volumenCalculado = calcularVolumen(
                      ejercicio.series, 
                      ejercicio.repeticiones, 
                      pesoEjercicio
                    );

                    return (
                      <div key={ejercicioIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{ejercicio.nombre}</h4>
                          {ejercicio.videoUrl && (
                            <a
                              href={ejercicio.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Ver video
                            </a>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Series:</span>
                            <span className="ml-2 font-medium">{ejercicio.series}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reps:</span>
                            <span className="ml-2 font-medium">{ejercicio.repeticiones}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Peso:</span>
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={pesoEjercicio ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                  handlePesoChange(diaSeleccionado, bloqueIndex, ejercicioIndex, value);
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <span className="text-gray-500 text-xs">kg</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Pausa:</span>
                            <span className="ml-2 font-medium">{ejercicio.pausa}s</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Volumen:</span>
                          <span className="ml-2 font-medium text-blue-600">
                            {volumenCalculado.toLocaleString()} kg
                          </span>
                          {pesoEjercicio === null && (
                            <span className="ml-2 text-xs text-gray-400">
                              (define el peso para calcular)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
