# Configuración Local - Backend

## Requisitos Previos
- Node.js 18+ instalado
- MongoDB instalado localmente o cuenta en MongoDB Atlas
- (Opcional) Cuenta de Google AI para Gemini API

---

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto (ya existe el ejemplo):

```bash
MONGODB_URI=mongodb://localhost:27017/emi-rutinas
JWT_SECRET=emi_super_secret_jwt_key_change_in_production_2024
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

**Notas importantes:**
- `MONGODB_URI`: Si usas MongoDB local, usa la URI proporcionada. Si usas Atlas, reemplázala con tu connection string.
- `JWT_SECRET`: Cambia este valor por uno seguro en producción.
- `GEMINI_API_KEY`: Obtén una clave API de https://makersuite.google.com/app/apikey

### 3. Iniciar MongoDB local (si aplica)
```bash
# En Windows
mongod

# En Mac/Linux
sudo systemctl start mongodb
# o
brew services start mongodb-community
```

### 4. Ejecutar seed data (Opcional)
Para crear datos de ejemplo:
```bash
npm run seed
```

Esto creará:
- **Profesor:** profesor@ejemplo.com / 123456
- **Alumno:** alumno@ejemplo.com / 123456
- Una rutina de ejemplo asignada al alumno

### 5. Iniciar servidor en modo desarrollo
```bash
npm run dev
```

El servidor estará corriendo en http://localhost:5000

---

## Verificar instalación

1. Visita http://localhost:5000/health
   - Deberías ver: `{"status":"OK","timestamp":"..."}`

2. Prueba la API de autenticación:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"profesor@ejemplo.com","password":"123456"}'
```

Deberías recibir un token JWT.

---

## Estructura del proyecto

```
src/
├── config/         # Configuración de DB y Gemini
├── models/         # Modelos de Mongoose
├── routes/         # Rutas de Express
├── controllers/    # Lógica de negocio
├── middleware/     # Middlewares (auth, error handling)
├── scripts/        # Scripts de utilidad (seed)
└── server.js       # Punto de entrada
```

---

## Scripts disponibles

- `npm run dev` - Iniciar servidor en modo desarrollo (con nodemon)
- `npm start` - Iniciar servidor en modo producción
- `npm run seed` - Ejecutar script de seed

---

## API Endpoints

### Autenticación
- POST `/api/auth/register` - Registro
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Usuario actual (requiere auth)

### Profesor
- GET/POST/PUT/DELETE `/api/profesor/alumnos` - CRUD de alumnos
- GET/POST/PUT/DELETE `/api/profesor/rutinas` - CRUD de rutinas
- GET/POST/DELETE `/api/profesor/ejercicios` - CRUD de ejercicios
- GET `/api/profesor/seguimiento/:alumnoId` - Ver progreso de alumno

### Alumno
- GET `/api/alumno/rutina` - Ver rutina actual
- GET/POST/PUT `/api/alumno/progreso` - Gestión de progreso
- POST `/api/alumno/chatbot` - Chat con IA

---

## Troubleshooting

### Error: "MongoServerError: connect ECONNREFUSED"
- MongoDB no está corriendo. Inicia MongoDB localmente.

### Error: "JWT_SECRET is not defined"
- Crea el archivo `.env` con las variables necesarias.

### Error: "Gemini API key not valid"
- Obtén una API key válida de Google AI.
- Si no tienes una, el chatbot no funcionará pero el resto de la app sí.

