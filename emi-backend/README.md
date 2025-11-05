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
- `PORT`: Puerto del servidor (default: 5000)
- `NODE_ENV`: Entorno (development/production)

## Desarrollo

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm start

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
- POST `/api/auth/register` - Registro
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Usuario actual

### Profesor
- GET/POST/PUT/DELETE `/api/profesor/alumnos` - Gestión de alumnos
- GET/POST/PUT/DELETE `/api/profesor/rutinas` - Gestión de rutinas
- GET/POST/DELETE `/api/profesor/ejercicios` - Gestión de ejercicios
- GET `/api/profesor/seguimiento/:alumnoId` - Seguimiento de alumnos

### Alumno
- GET `/api/alumno/rutina` - Ver rutina actual
- GET/POST/PUT `/api/alumno/progreso` - Gestión de progreso
- POST `/api/alumno/chatbot` - Chat con IA

## Health Check

- GET `/health` - Verificar estado del servidor

