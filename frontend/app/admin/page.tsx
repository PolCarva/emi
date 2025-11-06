'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { DashboardStats, ProfesorWithAlumnos } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profesores, setProfesores] = useState<ProfesorWithAlumnos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, profesoresResponse] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/profesores')
      ]);

      setStats(statsResponse.data.stats);
      setProfesores(profesoresResponse.data.profesores);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">👨‍🏫</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Profesores
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalProfesores || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Alumnos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalAlumnos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">👑</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Administradores
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalAdmins || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔗</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Enlaces Activos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.enlacesActivos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Profesores */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profesores Registrados
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Lista completa de profesores y sus alumnos asociados
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {profesores.length === 0 ? (
            <li className="px-4 py-4 text-center text-gray-500">
              No hay profesores registrados aún
            </li>
          ) : (
            profesores.map((profesor) => (
              <li key={profesor.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {profesor.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profesor.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profesor.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{profesor.totalAlumnos}</span> alumnos
                    </div>
                    <div className="text-sm text-gray-500">
                      Registrado: {new Date(profesor.fechaRegistro).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {profesor.alumnos.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Alumnos:</div>
                    <div className="flex flex-wrap gap-2">
                      {profesor.alumnos.slice(0, 5).map((alumno) => (
                        <span
                          key={alumno.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {alumno.nombre}
                        </span>
                      ))}
                      {profesor.alumnos.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{profesor.alumnos.length - 5} más
                        </span>
                      )}
                    </div>
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
