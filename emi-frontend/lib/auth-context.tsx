'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import type { AuthResponse, LoginCredentials, RegisterData, Profesor, Alumno } from '@/types';

interface AuthContextType {
  user: Profesor | Alumno | null;
  role: 'profesor' | 'alumno' | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profesor | Alumno | null>(null);
  const [role, setRole] = useState<'profesor' | 'alumno' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');

    if (token && savedUser && savedRole) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole as 'profesor' | 'alumno');
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.role);
      
      setUser(data.user);
      setRole(data.role);

      // Redirigir según el rol
      if (data.role === 'profesor') {
        router.push('/profesor');
      } else {
        router.push('/alumno');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { data: response } = await api.post<AuthResponse>('/api/auth/register', data);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('role', response.role);
      
      setUser(response.user);
      setRole(response.role);

      // Redirigir según el rol
      if (response.role === 'profesor') {
        router.push('/profesor');
      } else {
        router.push('/alumno');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al registrarse');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    
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

