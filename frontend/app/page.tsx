'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const [checkingAdmins, setCheckingAdmins] = useState(false);

  useEffect(() => {
    const checkSystemStatus = async () => {
      if (!isLoading) {
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'profesor') {
          router.push('/profesor');
        } else if (role === 'alumno') {
          router.push('/alumno');
        } else {
          // Usuario no autenticado, verificar si hay admins
          setCheckingAdmins(true);
          try {
            await api.get('/api/admin/dashboard');
            // Si hay respuesta, significa que hay admins
            router.push('/login');
          } catch (error: unknown) {
            // Si no hay respuesta o es error 403, significa que no hay admins
            const status = (error as { response?: { status?: number } })?.response?.status;
            const isNetworkError = !(error as { response?: { status?: number } })?.response;
            
            // Si es error de red (API no disponible), redirigir a login
            if (isNetworkError) {
              console.warn('Backend no disponible, redirigiendo a login');
              router.push('/login');
            } else if (status === 403 || status === 401) {
              router.push('/create-first-admin');
            } else {
              router.push('/login');
            }
          } finally {
            setCheckingAdmins(false);
          }
        }
      }
    };

    checkSystemStatus();
  }, [role, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">
          {checkingAdmins ? 'Verificando configuración del sistema...' : 'Cargando...'}
        </p>
      </div>
    </div>
  );
}
