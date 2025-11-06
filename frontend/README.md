# Emi Frontend - Plataforma de Gestión de Rutinas

Frontend de la plataforma de gestión de rutinas de entrenamiento construido con Next.js.

## Tecnologías

- Next.js 14+ (App Router)
- React 18
- TypeScript
- TailwindCSS
- React Query (TanStack Query)
- Axios

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.local.example .env.local

# Editar .env.local con la URL del backend
```

## Variables de Entorno

- `NEXT_PUBLIC_API_URL`: URL del backend API (default: http://localhost:3001)

## Desarrollo

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Estructura

```
app/
├── (auth)/         # Páginas de autenticación
├── profesor/       # Dashboard del profesor
├── alumno/         # Panel del alumno
└── layout.tsx      # Layout principal

components/
├── profesor/       # Componentes del dashboard profesor
└── alumno/         # Componentes del panel alumno

lib/
├── api.ts          # Cliente API con axios
├── queryClient.ts  # Configuración de React Query
└── auth-context.tsx # Context de autenticación

types/
└── index.ts        # Tipos TypeScript compartidos

hooks/              # Custom hooks
```

## Rutas Principales

### Autenticación
- `/login` - Login
- `/register` - Registro

### Profesor
- `/profesor` - Dashboard principal
- `/profesor/alumnos` - Lista de alumnos
- `/profesor/alumnos/[id]` - Detalle de alumno
- `/profesor/ejercicios` - Biblioteca de ejercicios

### Alumno
- `/alumno` - Rutina actual
- `/alumno/progreso` - Registro de progreso
- `/alumno/historial` - Historial de semanas
- `/alumno/chatbot` - Chat con IA
