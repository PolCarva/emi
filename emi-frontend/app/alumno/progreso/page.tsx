'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function ProgresoPage() {
  const [numeroSemana, setNumeroSemana] = useState(1);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [ejercicios, setEjercicios] = useState([
    { ejercicioId: '', pesoReal: 0, repeticionesReal: 0 }
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const { data: progreso } = useQuery({
    queryKey: ['progreso-alumno'],
    queryFn: async () => {
      const response = await api.get('/api/alumno/progreso');
      return response.data;
    },
  });

  const registrarMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/api/alumno/progreso', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso-alumno'] });
      setSuccess('Progreso registrado correctamente');
      setError('');
      setObservaciones('');
      setEjercicios([{ ejercicioId: '', pesoReal: 0, repeticionesReal: 0 }]);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al registrar progreso');
      setSuccess('');
    },
  });

  const agregarEjercicio = () => {
    setEjercicios([...ejercicios, { ejercicioId: '', pesoReal: 0, repeticionesReal: 0 }]);
  };

  const actualizarEjercicio = (index: number, field: string, value: any) => {
    const nuevosEjercicios = [...ejercicios];
    (nuevosEjercicios[index] as any)[field] = value;
    setEjercicios(nuevosEjercicios);
  };

  const eliminarEjercicio = (index: number) => {
    setEjercicios(ejercicios.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    registrarMutation.mutate({
      numeroSemana,
      fecha,
      observaciones,
      ejercicios: ejercicios.filter(e => e.ejercicioId && e.pesoReal > 0)
    });
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Registrar Progreso</h1>
        <p className="mt-2 text-gray-600">Registra tu entrenamiento diario</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Semana
              </label>
              <input
                type="number"
                min="1"
                value={numeroSemana}
                onChange={(e) => setNumeroSemana(parseInt(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="¿Cómo te sentiste durante el entrenamiento?"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ejercicios</h3>
              <button
                type="button"
                onClick={agregarEjercicio}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
              >
                + Agregar ejercicio
              </button>
            </div>

            <div className="space-y-4">
              {ejercicios.map((ejercicio, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        ID Ejercicio
                      </label>
                      <input
                        type="text"
                        value={ejercicio.ejercicioId}
                        onChange={(e) => actualizarEjercicio(index, 'ejercicioId', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ID del ejercicio"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={ejercicio.pesoReal}
                        onChange={(e) => actualizarEjercicio(index, 'pesoReal', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Repeticiones
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={ejercicio.repeticionesReal}
                        onChange={(e) => actualizarEjercicio(index, 'repeticionesReal', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      {ejercicios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarEjercicio(index)}
                          className="w-full text-red-600 hover:text-red-700 text-sm py-1"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={registrarMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {registrarMutation.isPending ? 'Guardando...' : 'Guardar Progreso'}
          </button>
        </form>
      </div>

      {progreso && progreso.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Historial Reciente</h2>
          <div className="space-y-4">
            {progreso.slice(0, 3).map((semana: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900">Semana {semana.numeroSemana}</p>
                <p className="text-sm text-gray-600">{semana.dias.length} días registrados</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

