# Guía de Deployment - Backend

## Opción 1: Railway

### Paso 1: Crear cuenta en Railway
1. Ve a https://railway.app
2. Crea una cuenta o inicia sesión con GitHub

### Paso 2: Crear nuevo proyecto
1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Conecta tu repositorio de emi-backend

### Paso 3: Configurar variables de entorno
En la sección de Variables, agrega:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/emi-rutinas
JWT_SECRET=tu_secret_super_seguro_aqui
GEMINI_API_KEY=tu_api_key_de_gemini
NODE_ENV=production
PORT=5000
```

### Paso 4: Configurar MongoDB Atlas
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea un cluster gratuito
3. Crea un usuario de base de datos
4. Obtén la connection string
5. Reemplaza en MONGODB_URI

### Paso 5: Deploy
Railway detectará automáticamente el proyecto Node.js y desplegará.

---

## Opción 2: Render

### Paso 1: Crear cuenta en Render
1. Ve a https://render.com
2. Crea una cuenta o inicia sesión con GitHub

### Paso 2: Crear Web Service
1. Click en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub

### Paso 3: Configurar servicio
```
Name: emi-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

### Paso 4: Variables de entorno
Agrega las mismas variables que en Railway.

### Paso 5: Deploy
Click en "Create Web Service" y espera el deployment.

---

## Configurar CORS para producción

Una vez desplegado, actualiza el archivo `src/server.js`:

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
```

Agrega la variable `FRONTEND_URL` con la URL de tu frontend en producción.

---

## Verificar deployment

Visita: `https://tu-backend-url.railway.app/health`

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2024-..."
}
```

