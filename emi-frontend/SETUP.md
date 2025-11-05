# Configuración Local - Frontend

## Requisitos Previos
- Node.js 18+ instalado
- Backend corriendo en http://localhost:5000

---

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Nota:** En producción, reemplaza esto con la URL de tu backend desplegado.

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará corriendo en http://localhost:3000

---

## Verificar instalación

1. Visita http://localhost:3000
   - Deberías ser redirigido a `/login`

2. Intenta hacer login con las credenciales de seed:
   - **Profesor:** profesor@ejemplo.com / 123456
   - **Alumno:** alumno@ejemplo.com / 123456

---

## Estructura del proyecto

```
app/
├── (auth)/          # Páginas de autenticación (login, register)
├── profesor/        # Dashboard del profesor
├── alumno/          # Panel del alumno
├── layout.tsx       # Layout principal
├── page.tsx         # Página de inicio
└── providers.tsx    # Providers (Auth, React Query)

components/
├── profesor/        # Componentes del dashboard profesor
├── alumno/          # Componentes del panel alumno
└── common/          # Componentes compartidos

lib/
├── api.ts           # Cliente API con axios
├── queryClient.ts   # Configuración de React Query
└── auth-context.tsx # Context de autenticación

types/
└── index.ts         # Tipos TypeScript

hooks/
└── useDebounce.ts   # Custom hooks
```

---

## Scripts disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar linter

---

## Rutas principales

### Autenticación
- `/login` - Iniciar sesión
- `/register` - Crear cuenta

### Profesor
- `/profesor` - Dashboard principal
- `/profesor/alumnos` - Lista de alumnos
- `/profesor/alumnos/[id]` - Detalle de alumno
- `/profesor/ejercicios` - Biblioteca de ejercicios

### Alumno
- `/alumno` - Ver rutina actual
- `/alumno/progreso` - Registrar progreso
- `/alumno/historial` - Ver historial de semanas
- `/alumno/chatbot` - Chat con IA

---

## Características

### Autenticación
- Sistema de login/registro con JWT
- Context API para manejo de estado global
- Protección de rutas por rol (profesor/alumno)
- Persistencia de sesión en localStorage

### Gestión de Estado
- React Query para fetching y caching de datos
- Invalidación automática de queries
- Optimistic updates en mutaciones

### UI/UX
- Diseño responsivo con Tailwind CSS
- Loading states y skeletons
- Manejo de errores con componentes dedicados
- Feedback visual en acciones

---

## Troubleshooting

### Error: "Failed to fetch" o "Network Error"
- Verifica que el backend esté corriendo en http://localhost:5000
- Verifica que NEXT_PUBLIC_API_URL esté configurado correctamente

### Error: "Unauthorized" o redirect constante al login
- Limpia el localStorage del navegador
- Verifica que el token JWT sea válido
- Verifica que el backend esté respondiendo correctamente

### Error en compilación
- Ejecuta `npm run build` para ver errores específicos
- Verifica que todas las dependencias estén instaladas
- Limpia caché: `rm -rf .next && npm run dev`

---

## Desarrollo

### Agregar nuevas páginas
1. Crea el archivo en `app/[ruta]/page.tsx`
2. El routing es automático (App Router de Next.js)

### Agregar nuevos componentes
1. Crea el archivo en `components/[categoria]/NombreComponente.tsx`
2. Exporta el componente como default

### Agregar nuevos tipos
1. Edita `types/index.ts`
2. Los tipos están disponibles globalmente con `@/types`

### Hacer llamadas a la API
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

// GET
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: async () => {
    const response = await api.get('/api/endpoint');
    return response.data;
  }
});

// POST/PUT/DELETE
const mutation = useMutation({
  mutationFn: async (data) => {
    return await api.post('/api/endpoint', data);
  },
  onSuccess: () => {
    // Invalidar queries, etc.
  }
});
```

