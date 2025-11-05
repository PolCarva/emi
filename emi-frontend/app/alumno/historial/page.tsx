'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function HistorialPage() {
  const { data: progreso, isLoading } = useQuery({
    queryKey: ['progreso-alumno'],
    queryFn: async () => {
      const response = await api.get('/api/alumno/progreso');
      return response.data;
    },
  });

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

      {progreso && progreso.length > 0 ? (
        <div className="space-y-6">
          {progreso.map((semana: any, semanaIndex: number) => (
            <div key={semanaIndex} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Semana {semana.numeroSemana}</h2>
                <p className="text-blue-100 text-sm">{semana.dias.length} días registrados</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {semana.dias.map((dia: any, diaIndex: number) => (
                    <div key={diaIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(dia.fecha).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {dia.observaciones && (
                            <p className="text-sm text-gray-600 mt-1">{dia.observaciones}</p>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {dia.ejercicios.length} ejercicios
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {dia.ejercicios.map((ejercicio: any, ejIndex: number) => (
                          <div key={ejIndex} className="bg-gray-50 rounded p-3 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <span className="text-gray-500">Peso:</span>
                                <span className="ml-2 font-medium">{ejercicio.pesoReal} kg</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Reps:</span>
                                <span className="ml-2 font-medium">{ejercicio.repeticionesReal}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Volumen:</span>
                                <span className="ml-2 font-medium text-blue-600">{ejercicio.volumenReal} kg</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">Aún no has registrado ningún progreso</p>
          <a
            href="/alumno/progreso"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            Registrar primer progreso
          </a>
        </div>
      )}
    </div>
  );
}

