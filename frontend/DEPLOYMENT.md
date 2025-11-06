# Guía de Deployment - Frontend

## Deployment en Vercel (Recomendado)

### Paso 1: Preparar proyecto
1. Asegúrate de que el proyecto compile sin errores:
```bash
npm run build
```

### Paso 2: Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Crea una cuenta o inicia sesión con GitHub

### Paso 3: Importar proyecto
1. Click en "Add New Project"
2. Selecciona tu repositorio de GitHub (emi-frontend)
3. Vercel detectará automáticamente que es un proyecto Next.js

### Paso 4: Configurar variables de entorno
En la sección de Environment Variables, agrega:
```
NEXT_PUBLIC_API_URL=https://tu-backend-url.railway.app
```

**Importante:** Reemplaza `tu-backend-url.railway.app` con la URL real de tu backend desplegado.

### Paso 5: Deploy
1. Click en "Deploy"
2. Espera a que termine el deployment
3. Vercel te dará una URL como: `https://emi-frontend.vercel.app`

---

## Configuración Post-Deployment

### 1. Actualizar CORS en el backend
En tu backend desplegado, agrega la URL de Vercel a las variables de entorno:
```
FRONTEND_URL=https://emi-frontend.vercel.app
```

### 2. Configurar dominio personalizado (Opcional)
1. En Vercel, ve a Settings > Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de Vercel para configurar DNS

---

## Deployment en Netlify (Alternativa)

### Paso 1: Crear cuenta en Netlify
1. Ve a https://netlify.com
2. Crea una cuenta

### Paso 2: Importar proyecto
1. Click en "Add new site" > "Import an existing project"
2. Conecta con GitHub
3. Selecciona el repositorio emi-frontend

### Paso 3: Configurar build
```
Build command: npm run build
Publish directory: .next
```

### Paso 4: Variables de entorno
Agrega en Site Settings > Environment Variables:
```
NEXT_PUBLIC_API_URL=https://tu-backend-url.railway.app
```

### Paso 5: Deploy
Click en "Deploy site"

---

## Verificar deployment

1. Visita tu URL de Vercel/Netlify
2. Deberías ver la página de login
3. Intenta hacer login con las credenciales de seed (si ejecutaste el script)
4. Verifica que las llamadas a la API funcionen correctamente

---

## Troubleshooting

### Error: "Failed to fetch" o CORS errors
- Verifica que FRONTEND_URL esté configurado correctamente en el backend
- Verifica que NEXT_PUBLIC_API_URL apunte a la URL correcta del backend

### Error: "API not responding"
- Verifica que el backend esté corriendo en Railway/Render
- Visita la URL del backend + /health para verificar

### Error en build
- Ejecuta `npm run build` localmente para ver errores
- Revisa los logs de deployment en Vercel

