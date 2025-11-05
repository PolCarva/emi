'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (role === 'profesor') {
        router.push('/profesor');
      } else if (role === 'alumno') {
        router.push('/alumno');
      } else {
        router.push('/login');
      }
    }
  }, [role, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
