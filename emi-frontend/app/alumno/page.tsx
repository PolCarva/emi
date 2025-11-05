'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Rutina } from '@/types';

export default function AlumnoRutinaPage() {
  const queryClient = useQueryClient();
  const [updatingPeso, setUpdatingPeso] = useState<{[key: string]: boolean}>({});

  const { data: rutina, isLoading, error } = useQuery<Rutina>({
    queryKey: ['rutina-alumno'],
    queryFn: async () => {
      const response = await api.get('/api/alumno/rutina');
      return response.data;
    },
  });

  const updatePesoMutation = useMutation({
    mutationFn: async ({ 
      diaIndex, 
      bloqueIndex, 
      ejercicioIndex, 
      peso 
    }: { 
      diaIndex: number; 
      bloqueIndex: number; 
      ejercicioIndex: number; 
      peso: number | null 
    }) => {
      const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
      setUpdatingPeso(prev => ({ ...prev, [key]: true }));
      
      try {
        const response = await api.put(
          `/api/alumno/rutina/ejercicio/${diaIndex}/${bloqueIndex}/${ejercicioIndex}/peso`,
          { peso }
        );
        return response.data;
      } finally {
        setUpdatingPeso(prev => ({ ...prev, [key]: false }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutina-alumno'] });
    },
  });

  const handlePesoChange = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    nuevoPeso: number | null
  ) => {
    updatePesoMutation.mutate({
      diaIndex,
      bloqueIndex,
      ejercicioIndex,
      peso: nuevoPeso === null || nuevoPeso === 0 ? null : nuevoPeso
    });
  };

  const calcularVolumen = (series: number, repeticiones: number, peso: number | null): number => {
    if (peso === null || peso === undefined) return 0;
    return series * repeticiones * peso;
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
            <p className="text-sm text-gray-500">Semana Actual</p>
            <p className="text-lg font-semibold text-gray-900">{rutina.semanaActual}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Días</p>
            <p className="text-lg font-semibold text-gray-900">{rutina.dias.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {rutina.dias.map((dia, diaIndex) => (
          <div key={diaIndex} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{dia.nombre}</h2>
            </div>
            <div className="p-6 space-y-6">
              {dia.bloques.map((bloque, bloqueIndex) => (
                <div key={bloqueIndex}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{bloque.nombre}</h3>
                  <div className="space-y-4">
                    {bloque.ejercicios.map((ejercicio, ejercicioIndex) => {
                      const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                      const isUpdating = updatingPeso[key] || false;
                      const volumenCalculado = calcularVolumen(
                        ejercicio.series, 
                        ejercicio.repeticiones, 
                        ejercicio.peso
                      );

                      return (
                        <div key={ejercicioIndex} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{ejercicio.nombre}</h4>
                            <a
                              href={ejercicio.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Ver video
                            </a>
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
                                  value={ejercicio.peso ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                    handlePesoChange(diaIndex, bloqueIndex, ejercicioIndex, value);
                                  }}
                                  disabled={isUpdating}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                                <span className="text-gray-500 text-xs">kg</span>
                                {isUpdating && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
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
                            {ejercicio.peso === null && (
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
        ))}
      </div>
    </div>
  );
}
