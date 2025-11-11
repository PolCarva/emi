'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProgressChart from '@/components/common/ProgressChart';

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

export default function HistorialPage() {
  const { data: progreso, isLoading } = useQuery<SemanaProgreso[]>({
    queryKey: ['progreso-alumno'],
    queryFn: async () => {
      const response = await api.get('/api/alumno/progreso');
      return response.data;
    },
  });

  // Calcular semana actual basada en las fechas
  const calcularSemanaActual = useMemo(() => {
    if (!progreso || progreso.length === 0) return 1;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Encontrar la última semana con días registrados
    const semanasConDias = progreso
      .filter(s => s.dias && s.dias.length > 0)
      .sort((a, b) => b.numeroSemana - a.numeroSemana);

    if (semanasConDias.length === 0) return 1;

    // Obtener la última semana
    const ultimaSemana = semanasConDias[0];
    
    // Encontrar el último día registrado
    const ultimoDia = ultimaSemana.dias
      .map(d => new Date(d.fecha))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!ultimoDia) return progreso.length > 0 ? progreso[progreso.length - 1].numeroSemana + 1 : 1;

    ultimoDia.setHours(0, 0, 0, 0);
    
    // Calcular días transcurridos desde el último día
    const diasTranscurridos = Math.floor((hoy.getTime() - ultimoDia.getTime()) / (1000 * 60 * 60 * 24));

    // Si el último día fue hace menos de 7 días, estamos en esa semana
    // Si fue hace 7 o más días, estamos en una nueva semana
    if (diasTranscurridos < 7) {
      return ultimaSemana.numeroSemana;
    } else {
      // Estamos en una nueva semana
      return ultimaSemana.numeroSemana + 1;
    }
  }, [progreso]);

  const [semanaSeleccionada, setSemanaSeleccionada] = useState<number>(1);
  const [acordeonAbierto, setAcordeonAbierto] = useState<{[key: string]: boolean}>({});

  // Actualizar semana seleccionada cuando se calcula la semana actual
  useEffect(() => {
    if (calcularSemanaActual && semanaSeleccionada === 1) {
      // Usar setTimeout para evitar setState síncrono en effect
      setTimeout(() => {
        setSemanaSeleccionada(calcularSemanaActual);
      }, 0);
    }
  }, [calcularSemanaActual, semanaSeleccionada]);

  // Obtener la semana actual para mostrar
  const semanaActual = useMemo(() => {
    if (!progreso) return null;
    return progreso.find(s => s.numeroSemana === semanaSeleccionada);
  }, [progreso, semanaSeleccionada]);

  // Obtener semanas disponibles
  const semanasDisponibles = useMemo(() => {
    if (!progreso) return [];
    return progreso.map(s => s.numeroSemana).sort((a, b) => a - b);
  }, [progreso]);

  const semanaMinima = semanasDisponibles.length > 0 ? Math.min(...semanasDisponibles) : 1;
  const semanaMaxima = semanasDisponibles.length > 0 ? Math.max(...semanasDisponibles) : 1;

  // Organizar historial por ejercicio (similar a la página del profesor)
  const historialPorEjercicio = useMemo(() => {
    if (!progreso || progreso.length === 0) return {};

    const ejerciciosMap: { [ejercicioId: string]: Array<{ semana: number; peso: number; repeticiones: number; volumen: number; fecha: string }> } = {};

    progreso
      .sort((a, b) => a.numeroSemana - b.numeroSemana)
      .forEach((semana) => {
        semana.dias?.forEach((dia) => {
          dia.ejercicios?.forEach((ejercicio) => {
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
  }, [progreso]);

  const irSemanaAnterior = () => {
    if (semanaSeleccionada > semanaMinima) {
      setSemanaSeleccionada(semanaSeleccionada - 1);
    } else if (semanaSeleccionada === calcularSemanaActual && calcularSemanaActual > 1) {
      // Si estamos en la semana actual y hay semanas previas, ir a la anterior
      const semanasPrevias = semanasDisponibles.filter(s => s < calcularSemanaActual);
      if (semanasPrevias.length > 0) {
        setSemanaSeleccionada(Math.max(...semanasPrevias));
      }
    }
  };

  const irSemanaSiguiente = () => {
    if (semanaSeleccionada < semanaMaxima) {
      setSemanaSeleccionada(semanaSeleccionada + 1);
    } else if (semanaSeleccionada === semanaMaxima && semanaSeleccionada < calcularSemanaActual) {
      // Si no hay más semanas guardadas pero estamos antes de la actual, ir a la actual
      setSemanaSeleccionada(calcularSemanaActual);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Historial de Progreso</h1>
        <p className="mt-2 text-gray-600">Revisa tu evolución semana a semana</p>
      </div>

      {/* Navegación de semanas */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={irSemanaAnterior}
            disabled={semanaSeleccionada <= semanaMinima && semanaSeleccionada === calcularSemanaActual}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              Semana {semanaSeleccionada}
            </h2>
            {semanaSeleccionada === calcularSemanaActual && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Semana Actual
              </span>
            )}
          </div>

          <button
            onClick={irSemanaSiguiente}
            disabled={semanaSeleccionada >= Math.max(semanaMaxima, calcularSemanaActual)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Siguiente
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sección de gráficas de progreso por ejercicio */}
      {Object.keys(historialPorEjercicio).length > 0 && (
        <div className="mb-8 bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Progreso por Ejercicio
          </h2>
          <div className="space-y-4">
            {Object.entries(historialPorEjercicio)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([ejercicioId, registros]) => {
                const acordeonKey = ejercicioId;
                const estaAbierto = acordeonAbierto[acordeonKey] || false;
                // Ordenar registros por semana (ascendente) para comparación
                const registrosOrdenados = [...registros].sort((a, b) => a.semana - b.semana);
                // Mostrar en orden descendente (más reciente primero)
                const registrosMostrar = [...registros].sort((a, b) => b.semana - a.semana);

                return (
                  <div key={ejercicioId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Título del ejercicio */}
                    <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        {ejercicioId}
                      </h4>
                    </div>

                    {/* Gráfica siempre visible */}
                    <div className="px-3 sm:px-4">
                      <ProgressChart registros={registros} ejercicioId={ejercicioId} />
                    </div>

                    {/* Botón para ver entradas debajo del chart */}
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <button
                        onClick={() => setAcordeonAbierto(prev => ({
                          ...prev,
                          [acordeonKey]: !prev[acordeonKey]
                        }))}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <span>Ver entradas</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${estaAbierto ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Lista de semanas dentro del acordeón */}
                    {estaAbierto && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-200">
                        <div className="pt-4 space-y-2">
                          {registrosMostrar.map((registro) => {
                            // Encontrar el índice en el array ordenado para comparación
                            const indiceEnOrdenado = registrosOrdenados.findIndex(r => 
                              r.semana === registro.semana && 
                              r.fecha === registro.fecha
                            );
                            const registroAnterior = indiceEnOrdenado > 0 ? registrosOrdenados[indiceEnOrdenado - 1] : null;

                            return (
                              <div key={`${ejercicioId}-${registro.semana}-${new Date(registro.fecha).getTime()}`} className="bg-gray-50 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
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
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
                                {registroAnterior && (
                                  <div className="mt-2 text-xs">
                                    {registro.peso > registroAnterior.peso ? (
                                      <span className="text-green-600">
                                        ↑ +{(registro.peso - registroAnterior.peso).toFixed(1)} kg vs semana anterior
                                      </span>
                                    ) : registro.peso < registroAnterior.peso ? (
                                      <span className="text-red-600">
                                        ↓ {(registro.peso - registroAnterior.peso).toFixed(1)} kg vs semana anterior
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        Sin cambio vs semana anterior
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Contenido de la semana */}
      {semanaActual && semanaActual.dias && semanaActual.dias.length > 0 ? (
        <div className="space-y-6">
          {semanaActual.dias
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
            .map((dia, diaIndex) => {
              const fechaDia = new Date(dia.fecha);
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              fechaDia.setHours(0, 0, 0, 0);
              
              const esHoy = fechaDia.getTime() === hoy.getTime();
              const esPasado = fechaDia.getTime() < hoy.getTime();
              const esFuturo = fechaDia.getTime() > hoy.getTime();

              return (
                <div key={diaIndex} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className={`px-6 py-4 ${esHoy ? 'bg-green-600' : esPasado ? 'bg-gray-600' : 'bg-blue-600'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {fechaDia.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        {esHoy && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            Hoy
                          </span>
                        )}
                        {esPasado && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                            Pasado
                          </span>
                        )}
                        {esFuturo && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                            Próximo
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                        {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {dia.observaciones && (
                      <p className="text-white text-sm mt-2 opacity-90">{dia.observaciones}</p>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-3">
                      {dia.ejercicios.map((ejercicio, ejIndex) => (
                        <div key={ejIndex} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="mb-2">
                            <p className="font-medium text-gray-900">{ejercicio.ejercicioId}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Peso:</span>
                              <span className="font-semibold text-gray-900">{ejercicio.pesoReal} kg</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Repeticiones:</span>
                              <span className="font-semibold text-gray-900">{ejercicio.repeticionesReal}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Volumen:</span>
                              <span className="font-semibold text-blue-600">{ejercicio.volumenReal.toLocaleString()} kg</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : semanaSeleccionada === calcularSemanaActual ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-2">Esta semana aún no tiene registros</p>
          <p className="text-sm text-gray-400 mb-4">Comienza a registrar tu progreso</p>
          <a
            href="/alumno/progreso"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Registrar Progreso
          </a>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">No hay registros para la semana {semanaSeleccionada}</p>
        </div>
      )}

      {/* Mensaje si no hay progreso en absoluto */}
      {(!progreso || progreso.length === 0) && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">Aún no has registrado ningún progreso</p>
          <a
            href="/alumno/progreso"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Registrar primer progreso
          </a>
        </div>
      )}
    </div>
  );
}
