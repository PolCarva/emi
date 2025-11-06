'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { ProfesorWithAlumnos } from '@/types';
import Link from 'next/link';

export default function ProfesoresPage() {
  const [profesores, setProfesores] = useState<ProfesorWithAlumnos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProfesores();
  }, []);

  const loadProfesores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/profesores');
      setProfesores(response.data.profesores);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar profesores');
    } finally {
      setLoading(false);
    }
  };

  const filteredProfesores = profesores.filter(profesor =>
    profesor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profesor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profesores</h1>
          <p className="text-gray-600">Gestión completa de profesores y sus alumnos</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Buscar profesores
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nombre o email..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Profesores */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProfesores.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              {searchTerm ? 'No se encontraron profesores con ese criterio' : 'No hay profesores registrados aún'}
            </li>
          ) : (
            filteredProfesores.map((profesor) => (
              <li key={profesor.id} className="px-4 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {profesor.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-gray-900">
                        {profesor.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {profesor.email}
                      </div>
                      <div className="text-sm text-gray-400">
                        Registrado: {new Date(profesor.fechaRegistro).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {profesor.totalAlumnos}
                      </div>
                      <div className="text-sm text-gray-500">
                        alumnos
                      </div>
                    </div>
                    <Link
                      href={`/admin/profesores/${profesor.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>

                {/* Lista de alumnos */}
                {profesor.alumnos.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Alumnos ({profesor.alumnos.length}):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {profesor.alumnos.map((alumno) => (
                        <div key={alumno.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {alumno.nombre.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {alumno.nombre}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {alumno.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profesor.alumnos.length === 0 && (
                  <div className="mt-4 text-center py-4">
                    <p className="text-sm text-gray-500">Este profesor aún no tiene alumnos asignados</p>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
