'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import type { AuthResponse, LoginCredentials, RegisterData, Profesor, Alumno, Admin } from '@/types';

interface AuthContextType {
  user: Profesor | Alumno | Admin | null;
  role: 'profesor' | 'alumno' | 'admin' | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profesor | Alumno | Admin | null>(null);
  const [role, setRole] = useState<'profesor' | 'alumno' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const token = localStorage.getItem('emi-token');
    const savedUser = localStorage.getItem('emi-user');
    const savedRole = localStorage.getItem('emi-role');

    if (token && savedUser && savedRole) {
      // Usar setTimeout para evitar setState síncrono en effect
      setTimeout(() => {
        setUser(JSON.parse(savedUser));
        setRole(savedRole as 'profesor' | 'alumno' | 'admin');
      }, 0);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      localStorage.setItem('emi-token', data.token);
      localStorage.setItem('emi-user', JSON.stringify(data.user));
      localStorage.setItem('emi-role', data.role);
      
      setUser(data.user);
      setRole(data.role);

      // Redirigir según el rol
      if (data.role === 'admin') {
        router.push('/admin');
      } else if (data.role === 'profesor') {
        router.push('/profesor');
      } else {
        router.push('/alumno');
      }
    } catch (error: unknown) {
      // Asegurarse de que el error se propague correctamente
      const errorMessage = (error as { response?: { data?: { error?: string }; message?: string } })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          'Error al iniciar sesión';
      throw new Error(errorMessage);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { data: response } = await api.post<AuthResponse>('/api/auth/register', data);
      
      localStorage.setItem('emi-token', response.token);
      localStorage.setItem('emi-user', JSON.stringify(response.user));
      localStorage.setItem('emi-role', response.role);
      
      setUser(response.user);
      setRole(response.role);

      // Redirigir según el rol
      if (response.role === 'admin') {
        router.push('/admin');
      } else if (response.role === 'profesor') {
        router.push('/profesor');
      } else {
        router.push('/alumno');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al registrarse';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('emi-token');
    localStorage.removeItem('emi-user');
    localStorage.removeItem('emi-role');
    
    setUser(null);
    setRole(null);
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

