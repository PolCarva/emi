'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import api from '@/lib/api';
import type { Alumno } from '@/types';

export default function CrearRutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: alumno } = useQuery<Alumno>({
    queryKey: ['alumno', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/alumnos/${id}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/api/profesor/rutinas', { ...data, alumnoId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumno', id] });
      queryClient.invalidateQueries({ queryKey: ['rutina', id] });
      router.push(`/profesor/alumnos/${id}`);
    },
    onError: (err: any) => {
      console.error('Error al crear rutina:', err);
      alert('Error al crear rutina: ' + (err.response?.data?.error || 'Error desconocido'));
    },
  });

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link href={`/profesor/alumnos/${id}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver al alumno
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Rutina</h1>
        {alumno && (
          <p className="mt-2 text-gray-600">Para {alumno.nombre}</p>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 mb-4">
          El formulario completo para crear rutinas está en desarrollo. Por ahora, puedes crear rutinas directamente a través de la API.
        </p>
        <button
          onClick={() => router.push(`/profesor/alumnos/${id}`)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

