import axios from 'axios';

// Asegurar que la URL siempre tenga el protocolo
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  // Si la URL no empieza con http:// o https://, agregar http://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `http://${url}`;
  }
  return url;
};

const API_URL = getApiUrl();

// Log para debugging (remover en producción)
if (typeof window !== 'undefined') {
  console.log('API URL configurada:', API_URL);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('emi-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('emi-token');
      localStorage.removeItem('emi-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

