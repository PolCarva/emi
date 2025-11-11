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
            // Intentar verificar si hay admins (sin token, debería dar 401/403)
            await api.get('/api/admin/dashboard');
            // Si hay respuesta, significa que hay admins
            router.push('/login');
          } catch (error: unknown) {
            // Si no hay respuesta o es error 403/401, significa que no hay admins o requiere auth
            const status = (error as { response?: { status?: number } })?.response?.status;
            const isNetworkError = !(error as { response?: { status?: number } })?.response;
            const isCorsError = (error as { message?: string })?.message?.includes('CORS') || 
                               (error as { code?: string })?.code === 'ERR_NETWORK';
            
            // Si es error de red o CORS, redirigir a login (asumimos que hay admins)
            if (isNetworkError || isCorsError) {
              console.warn('Error de conexión con el backend, redirigiendo a login');
              router.push('/login');
            } else if (status === 403 || status === 401) {
              // 401/403 significa que requiere autenticación, así que hay sistema configurado
              router.push('/login');
            } else if (status === 404) {
              // 404 significa que la ruta no existe, redirigir a login
              router.push('/login');
            } else {
              // Otros errores, intentar crear admin
              router.push('/create-first-admin');
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
