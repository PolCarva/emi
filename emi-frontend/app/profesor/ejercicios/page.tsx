'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface EjercicioProfesor {
  _id?: string;
  id?: string;
  nombre: string;
  videoUrl: string;
}

export default function EjerciciosPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEjercicio, setEditingEjercicio] = useState<EjercicioProfesor | null>(null);
  const [nombre, setNombre] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: ejercicios, isLoading } = useQuery<EjercicioProfesor[]>({
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nombre: string; videoUrl: string } }) => {
      return await api.put(`/api/profesor/ejercicios/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setEditingEjercicio(null);
      setNombre('');
      setVideoUrl('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al actualizar ejercicio');
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

  const handleEdit = (ejercicio: EjercicioProfesor) => {
    setEditingEjercicio(ejercicio);
    setNombre(ejercicio.nombre);
    setVideoUrl(ejercicio.videoUrl);
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEjercicio(null);
    setNombre('');
    setVideoUrl('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (editingEjercicio) {
      const id = editingEjercicio._id || editingEjercicio.id;
      if (id) {
        updateMutation.mutate({ id, data: { nombre, videoUrl } });
      }
    } else {
      createMutation.mutate({ nombre, videoUrl });
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ejercicios</h1>
          <p className="mt-2 text-gray-600">Tu biblioteca personal de ejercicios</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Nuevo Ejercicio
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingEjercicio ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}
          </h2>
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
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : editingEjercicio
                  ? 'Guardar Cambios'
                  : 'Crear Ejercicio'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ejercicios && ejercicios.length > 0 ? (
          ejercicios.map((ejercicio: EjercicioProfesor, index) => {
            const ejercicioId = ejercicio._id || ejercicio.id || `ejercicio-${index}`;
            return (
              <div key={ejercicioId} className="bg-white shadow rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{ejercicio.nombre}</h3>
                <a
                  href={ejercicio.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 block mb-3"
                >
                  Ver video
                </a>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(ejercicio)}
                    className="flex-1 text-blue-600 hover:text-blue-700 text-sm px-2 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este ejercicio?')) {
                        deleteMutation.mutate(ejercicio._id || ejercicio.id || '');
                      }
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 text-sm px-2 py-1 border border-red-300 rounded-md hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No tienes ejercicios guardados</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea ejercicios para poder usarlos en las rutinas de tus alumnos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
