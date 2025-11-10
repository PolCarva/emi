'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import type { Alumno } from '@/types';

export default function AlumnosPage() {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: alumnos, isLoading } = useQuery<Alumno[]>({
    queryKey: ['alumnos'],
    queryFn: async () => {
      const response = await api.get('/api/profesor/alumnos');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nombre: string; email: string; password: string }) => {
      return await api.post('/api/profesor/alumnos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      setShowForm(false);
      setNombre('');
      setEmail('');
      setPassword('');
      setError('');
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al crear alumno');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/profesor/alumnos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({ nombre, email, password });
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Alumnos</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Gestiona tus alumnos y sus rutinas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          {showForm ? 'Cancelar' : 'Nuevo Alumno'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Alumno</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Alumno'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {alumnos && alumnos.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {alumnos.map((alumno) => (
              <li key={alumno.id || `alumno-${alumno.email}`} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Link href={`/profesor/alumnos/${alumno.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {alumno.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{alumno.nombre}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{alumno.email}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    {alumno.rutinaActualId ? (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        Con rutina
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                        Sin rutina
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este alumno?')) {
                          deleteMutation.mutate(alumno.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm whitespace-nowrap"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No tienes alumnos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}

