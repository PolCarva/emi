'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Ejercicio } from '@/types';

export default function EjerciciosPage() {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: ejercicios, isLoading } = useQuery<Ejercicio[]>({
    queryKey: ['ejercicios'],
    queryFn: async () => {
      const response = await api.get('/api/profesor/ejercicios');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nombre: string; videoUrl: string }) => {
      return await api.post('/api/profesor/ejercicios', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setShowForm(false);
      setNombre('');
      setVideoUrl('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al crear ejercicio');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/profesor/ejercicios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({ nombre, videoUrl });
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ejercicios</h1>
          <p className="mt-2 text-gray-600">Tu biblioteca personal de ejercicios</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nuevo Ejercicio'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Ejercicio</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del ejercicio</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Press de banca"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del video</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/..."
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Ejercicio'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ejercicios && ejercicios.length > 0 ? (
          ejercicios.map((ejercicio: any, index) => {
            const ejercicioId = ejercicio._id || ejercicio.id || `ejercicio-${index}`;
            return (
            <div key={ejercicioId} className="bg-white shadow rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{ejercicio.nombre}</h3>
              <a
                href={ejercicio.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 block mb-2"
              >
                Ver video
              </a>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar este ejercicio?')) {
                    deleteMutation.mutate(ejercicio._id || ejercicio.id);
                  }
                }}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No tienes ejercicios guardados</p>
          </div>
        )}
      </div>
    </div>
  );
}

