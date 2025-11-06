# Emi Backend - API de Gestión de Rutinas

Backend para la plataforma de gestión de rutinas de entrenamiento.

## Tecnologías

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Gemini AI Integration

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
```

## Variables de Entorno

- `MONGODB_URI`: URI de conexión a MongoDB
- `JWT_SECRET`: Secreto para firmar tokens JWT
- `GEMINI_API_KEY`: API key de Google Gemini
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno (development/production)
- `REGISTRATION_CODE`: Código de invitación para registro (opcional, legacy)
- `FRONTEND_URL`: URL del frontend para generar enlaces de invitación

## Desarrollo

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm start

# Crear primer administrador (solo para inicialización)
npm run create-admin

# Probar creación de ejercicios por defecto
npm run test-exercises

# Seed data de prueba
npm run seed
```

## Estructura

```
src/
├── config/         # Configuración de DB y servicios externos
├── models/         # Modelos de Mongoose
├── routes/         # Rutas de Express
├── controllers/    # Controladores/lógica de negocio
├── middleware/     # Middlewares personalizados
├── scripts/        # Scripts de utilidad
└── server.js       # Punto de entrada
```

## API Endpoints

### Autenticación
- POST `/api/auth/register` - Registro de profesores (requiere enlace de invitación)
- POST `/api/auth/login` - Login (soporta admin/profesor/alumno)
- GET `/api/auth/me` - Usuario actual

### Administrador
- GET `/api/admin/dashboard` - Estadísticas del dashboard
- GET `/api/admin/profesores` - Lista de profesores con alumnos
- GET/POST `/api/admin/invitations` - Gestión de enlaces de invitación
- DELETE `/api/admin/invitations/:id` - Eliminar enlace de invitación
- POST `/api/admin/create-first-admin` - Crear primer admin (solo inicialización)

### Profesor
- GET/POST/PUT/DELETE `/api/profesor/alumnos` - Gestión de alumnos
- GET/POST/PUT/DELETE `/api/profesor/rutinas` - Gestión de rutinas
- GET/POST/DELETE `/api/profesor/ejercicios` - Gestión de ejercicios
- GET `/api/profesor/seguimiento/:alumnoId` - Seguimiento de alumnos

### Alumno
- GET `/api/alumno/rutina` - Ver rutina actual
- GET/POST/PUT `/api/alumno/progreso` - Gestión de progreso
- POST `/api/alumno/chatbot` - Chat con IA

## Sistema de Roles y Enlaces de Invitación

### Roles del Sistema

1. **Administrador**: Control total del sistema
   - Gestiona profesores y alumnos
   - Crea enlaces de invitación para profesores
   - Visualiza estadísticas y reportes

2. **Profesor**: Gestiona alumnos y rutinas
   - Crea y administra alumnos
   - Diseña rutinas de entrenamiento
   - Hace seguimiento del progreso

3. **Alumno**: Accede a rutinas y registra progreso
   - Visualiza rutinas asignadas
   - Registra progreso de ejercicios
   - Interactúa con el chatbot de IA

### Enlaces de Invitación

Los profesores solo pueden registrarse usando enlaces de invitación generados por administradores:

1. **Crear enlace**: Admin genera enlace único con fecha de expiración
2. **Distribuir enlace**: El enlace incluye automáticamente el código de invitación
3. **Registro**: El profesor hace clic en el enlace y completa el registro
4. **Uso único**: Cada enlace solo puede ser usado una vez

### Ejercicios por Defecto

Cuando un profesor se registra exitosamente, automáticamente obtiene **55 ejercicios predefinidos** organizados por grupos musculares:

- **🦵 Piernas/Glúteos**: 14 ejercicios (Sentadillas, Pesos muertos, Hip Thrust, etc.)
- **💪 Pecho**: 7 ejercicios (Press de banca, Aperturas, Fondos, etc.)
- **🦾 Espalda**: 9 ejercicios (Dominadas, Remo, Jalón al pecho, etc.)
- **🫱 Hombros**: 7 ejercicios (Press militar, Elevaciones, Shrugs, etc.)
- **🦾 Brazos**: 11 ejercicios (Bíceps: 6, Tríceps: 5)
- **🧍 Core/Abdominales**: 8 ejercicios (Plancha, Crunch, Russian twist, etc.)

Los profesores pueden editar, agregar o eliminar estos ejercicios según sus necesidades.

### Inicialización del Sistema

Para configurar el sistema por primera vez:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Crear el primer administrador
npm run create-admin

# 4. Iniciar el servidor
npm run dev
```

El primer administrador podrá acceder al panel de control y comenzar a crear enlaces de invitación para profesores.

## Health Check

- GET `/health` - Verificar estado del servidor

