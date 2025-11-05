'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import api from '@/lib/api';
import type { Alumno, Rutina } from '@/types';

export default function AlumnoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: alumno, isLoading: loadingAlumno } = useQuery<Alumno>({
    queryKey: ['alumno', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/alumnos/${id}`);
      return response.data;
    },
  });

  const { data: rutina, isLoading: loadingRutina } = useQuery<Rutina>({
    queryKey: ['rutina', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/rutinas/${id}`);
      return response.data;
    },
    enabled: !!alumno?.rutinaActualId,
  });

  const { data: seguimiento } = useQuery({
    queryKey: ['seguimiento', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/seguimiento/${id}`);
      return response.data;
    },
  });

  if (loadingAlumno) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Alumno no encontrado</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link href="/profesor/alumnos" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver a alumnos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{alumno.nombre}</h1>
        <p className="mt-2 text-gray-600">{alumno.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="text-sm text-gray-900">{alumno.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado de rutina</dt>
              <dd className="text-sm text-gray-900">
                {alumno.rutinaActualId ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Con rutina asignada
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Sin rutina
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones</h2>
          <div className="space-y-2">
            {alumno.rutinaActualId ? (
              <Link
                href={`/profesor/alumnos/${id}/rutina/editar`}
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Editar Rutina
              </Link>
            ) : (
              <Link
                href={`/profesor/alumnos/${id}/rutina/crear`}
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Crear Rutina
              </Link>
            )}
            <Link
              href={`/profesor/seguimiento/${id}`}
              className="block w-full bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Ver Seguimiento
            </Link>
          </div>
        </div>
      </div>

      {rutina && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Rutina Actual</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Nombre:</span> {rutina.nombre}</p>
            <p><span className="font-medium">Objetivo:</span> {rutina.objetivo}</p>
            <p><span className="font-medium">Nivel:</span> {rutina.nivel}</p>
            <p><span className="font-medium">Días de entrenamiento:</span> {rutina.dias.length}</p>
          </div>
        </div>
      )}

      {seguimiento && seguimiento.historialSemanas && seguimiento.historialSemanas.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Progreso Reciente</h2>
          <p className="text-sm text-gray-600">
            Semanas registradas: {seguimiento.historialSemanas.length}
          </p>
        </div>
      )}
    </div>
  );
}

