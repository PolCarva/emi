'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface EjercicioProfesor {
  _id?: string;
  id?: string;
  nombre: string;
  videoUrl?: string | null;
}

export default function EjerciciosPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEjercicio, setEditingEjercicio] = useState<EjercicioProfesor | null>(null);
  const [nombre, setNombre] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: ejercicios, isLoading } = useQuery<EjercicioProfesor[]>({
    queryKey: ['ejercicios'],
    queryFn: async () => {
      const response = await api.get('/api/profesor/ejercicios');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nombre: string; videoUrl?: string | null }) => {
      return await api.post('/api/profesor/ejercicios', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setShowForm(false);
      setNombre('');
      setVideoUrl('');
      setError('');
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al crear ejercicio');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nombre: string; videoUrl?: string | null } }) => {
      return await api.put(`/api/profesor/ejercicios/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setEditingEjercicio(null);
      setNombre('');
      setVideoUrl('');
      setError('');
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al actualizar ejercicio');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/profesor/ejercicios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setEjerciciosSeleccionados(new Set());
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await api.delete('/api/profesor/ejercicios/multiple', { data: { ids } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setEjerciciosSeleccionados(new Set());
    },
    onError: (err: unknown) => {
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al eliminar ejercicios';
      alert('Error al eliminar ejercicios: ' + errorMessage);
    },
  });

  const handleEdit = (ejercicio: EjercicioProfesor) => {
    setEditingEjercicio(ejercicio);
    setNombre(ejercicio.nombre);
    setVideoUrl(ejercicio.videoUrl || '');
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
    
    const videoUrlFinal = videoUrl.trim() || null;
    
    if (editingEjercicio) {
      const id = editingEjercicio._id || editingEjercicio.id;
      if (id) {
        updateMutation.mutate({ id, data: { nombre, videoUrl: videoUrlFinal } });
      }
    } else {
      createMutation.mutate({ nombre, videoUrl: videoUrlFinal });
    }
  };

  // Toggle selección de un ejercicio
  const toggleSeleccionEjercicio = (ejercicioId: string) => {
    setEjerciciosSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(ejercicioId)) {
        nuevo.delete(ejercicioId);
      } else {
        nuevo.add(ejercicioId);
      }
      return nuevo;
    });
  };

  // Seleccionar/deseleccionar todos los ejercicios
  const toggleSeleccionarTodos = () => {
    if (!ejercicios) return;
    
    const todosSeleccionados = ejercicios.every(ej => {
      const id = ej._id || ej.id || '';
      return ejerciciosSeleccionados.has(id);
    });

    setEjerciciosSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (todosSeleccionados) {
        // Deseleccionar todos
        nuevo.clear();
      } else {
        // Seleccionar todos
        ejercicios.forEach(ej => {
          const id = ej._id || ej.id || '';
          if (id) nuevo.add(id);
        });
      }
      return nuevo;
    });
  };

  // Eliminar ejercicios seleccionados
  const handleEliminarSeleccionados = () => {
    if (ejerciciosSeleccionados.size === 0) return;
    
    const ids = Array.from(ejerciciosSeleccionados);
    const count = ids.length;
    
    if (confirm(`¿Estás seguro de eliminar ${count} ejercicio(s)?`)) {
      deleteMultipleMutation.mutate(ids);
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
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ejercicios</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Tu biblioteca personal de ejercicios</p>
        </div>
        {!showForm && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {ejercicios && ejercicios.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border border-gray-200">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ejercicios.every(ej => {
                        const id = ej._id || ej.id || '';
                        return ejerciciosSeleccionados.has(id);
                      }) && ejercicios.length > 0}
                      onChange={toggleSeleccionarTodos}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>
                      {ejerciciosSeleccionados.size > 0
                        ? `${ejerciciosSeleccionados.size} seleccionado(s)`
                        : 'Seleccionar todos'}
                    </span>
                  </label>
                </div>
                {ejerciciosSeleccionados.size > 0 && (
                  <button
                    onClick={handleEliminarSeleccionados}
                    disabled={deleteMultipleMutation.isPending}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    {deleteMultipleMutation.isPending ? 'Eliminando...' : `Eliminar ${ejerciciosSeleccionados.size}`}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              Nuevo Ejercicio
            </button>
          </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del video (opcional)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
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
            const estaSeleccionado = ejerciciosSeleccionados.has(ejercicioId);
            return (
              <div 
                key={ejercicioId} 
                className={`bg-white shadow rounded-lg p-4 border-2 transition-colors ${
                  estaSeleccionado ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={estaSeleccionado}
                    onChange={() => toggleSeleccionEjercicio(ejercicioId)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <h3 className="font-medium text-gray-900 flex-1">{ejercicio.nombre}</h3>
                </div>
                {ejercicio.videoUrl && (
                  <a
                    href={ejercicio.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 block mb-3 ml-6"
                  >
                    Ver video
                  </a>
                )}
                <div className="flex space-x-2 ml-6">
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
