# 🏋️ Plataforma Web de Gestión de Rutinas

## 🎯 Descripción General

Aplicación web para la **gestión de rutinas de entrenamiento** entre **profesores** y **alumnos**.  
Cada profesor podrá crear y administrar rutinas personalizadas para sus alumnos, realizar seguimiento semanal del progreso y mantener una base de ejercicios propios.  
Los alumnos podrán visualizar sus rutinas, registrar su progreso semanal y consultar un chatbot integrado con IA sobre su entrenamiento.

---

## 👥 Roles de Usuario

### 1. Profesor

**Permisos y capacidades:**
- Tiene un **dashboard individual**.
- Puede **ver su listado de alumnos** asignados.
- Puede **agregar nuevos alumnos**.
- Puede **editar, crear y eliminar rutinas** por alumno.
- Puede **ver el seguimiento semanal** de cada alumno.
- Puede **crear y guardar ejercicios propios** (nombre + video).
  - Los ejercicios creados se almacenan **solo en su perfil**, no se comparten entre profesores.
  - Puede reutilizar sus ejercicios al crear nuevas rutinas.

### 2. Alumno

**Permisos y capacidades:**
- Puede **ver su rutina asignada**.
- Puede **registrar su progreso diario y semanal**.
- Puede **consultar semanas previas** para ver evolución.
- Puede **chatear con un chatbot IA** integrado.
  - El chatbot accede a los datos de las **últimas 5 semanas** de progreso.
  - Permite realizar consultas sobre ejercicios, ajustes o sugerencias personalizadas.

---

## 🧩 Estructura de una Rutina

Cada **rutina** se compone de:

### Información General

| Campo | Descripción | Tipo | Valores |
|-------|-------------|------|---------|
| **Nombre** | Nombre de la rutina | string | - |
| **Género** | Género del alumno | enum | Masculino / Femenino / Otro |
| **Objetivo de entrenamiento** | Objetivo principal | string | Ej: fuerza, hipertrofia, resistencia, etc. |
| **Edad** | Edad del alumno | number | - |
| **Nivel** | Nivel de experiencia | enum | Principiante / Intermedio / Avanzado |
| **Periodización** | Bloques de entrenamiento definidos por semanas | string | - |
| **Semana actual** | Semana activa de visualización | number | Permite cambiar para visualizar semanas previas |

### Estructura Semanal y Diaria

Cada rutina está dividida por **días de la semana**, y cada día contiene **bloques**.

**Jerarquía:**
```
Rutina
  └── Día (DiaRutina)
      └── Bloque (Bloque)
          └── Ejercicio (Ejercicio)
```

**Ejemplo de estructura:**
- **Día 1: Pecho y Tríceps**
  - **Bloque 1**
    - Press plano con barra
    - Press inclinado con mancuernas
  - **Bloque 2**
    - Fondos en paralelas
    - Extensión de tríceps en polea
- **Día 2: Espalda y Bíceps**
  - **Bloque 1**
    - Dominadas
    - Remo con barra

### Estructura de un Ejercicio

Cada **ejercicio** dentro de una rutina posee los siguientes atributos:

| Campo | Descripción | Tipo | Ejemplo |
|-------|-------------|------|---------|
| **Nombre** | Nombre del ejercicio | string | "Press plano con barra" |
| **Video (link)** | URL del video demostrativo | string | URL válida |
| **Series** | Número de series | number | 3 |
| **Repeticiones por serie** | Número de repeticiones | number | 10 |
| **Peso** | Peso utilizado en kilogramos | number | 60 |
| **Pausa (segundos)** | Descanso entre series | number | 90 |
| **Volumen levantado** | Cálculo automático | number | series × repeticiones × peso |

---

## 📈 Seguimiento del Alumno

### Registro de Progreso

Cada alumno podrá registrar su **progreso diario y semanal** con los siguientes datos:
- Carga de peso utilizado.
- Repeticiones efectivas.
- Notas o comentarios del día.
- Estado físico o sensaciones.

### Almacenamiento y Visualización

Los datos quedarán **almacenados por semana**, permitiendo:
- Comparar evolución en cada ejercicio.
- Consultar semanas anteriores.
- Generar gráficos o métricas de progreso (por ejemplo, volumen total levantado).

Los profesores podrán visualizar toda esta información desde su dashboard.

---

## 🧠 Chatbot con IA Integrado

Cada alumno dispone de un **asistente virtual con IA** con las siguientes características:

**Funcionalidades:**
- Puede responder preguntas sobre:
  - Ejercicios de la rutina.
  - Cambios o ajustes sugeridos.
  - Progreso o desempeño.

**Limitaciones y contexto:**
- La IA accede únicamente a los **últimos 5 registros semanales** del alumno.
- Responde en lenguaje natural y puede citar ejemplos o métricas del alumno.

---

## 🗃️ Modelos de Datos

### Profesor

```typescript
interface Profesor {
  id: string
  nombre: string
  email: string
  passwordHash: string
  alumnos: string[] // IDs de alumnos
  ejercicios: Ejercicio[] // base personal de ejercicios
}
```

### Alumno

```typescript
interface Alumno {
  id: string
  nombre: string
  email: string
  passwordHash: string
  profesorId: string
  rutinaActualId: string
  historialSemanas: SemanaProgreso[]
}
```

### Rutina

```typescript
interface Rutina {
  id: string
  alumnoId: string
  profesorId: string
  nombre: string
  genero: string // "Masculino" | "Femenino" | "Otro"
  objetivo: string
  edad: number
  nivel: string // "Principiante" | "Intermedio" | "Avanzado"
  periodizacion: string
  semanaActual: number
  dias: DiaRutina[]
}
```

### DiaRutina

```typescript
interface DiaRutina {
  nombre: string // Ej: "Día 1: Pecho y Tríceps"
  bloques: Bloque[]
}
```

### Bloque

```typescript
interface Bloque {
  nombre: string
  ejercicios: Ejercicio[]
}
```

### Ejercicio

```typescript
interface Ejercicio {
  nombre: string
  videoUrl: string
  series: number
  repeticiones: number
  peso: number
  pausa: number
  volumen: number // Calculado: series × repeticiones × peso
}
```

### SemanaProgreso

```typescript
interface SemanaProgreso {
  numeroSemana: number
  dias: ProgresoDia[]
}
```

### ProgresoDia

```typescript
interface ProgresoDia {
  fecha: string // ISO date string
  observaciones: string
  ejercicios: ProgresoEjercicio[]
}
```

### ProgresoEjercicio

```typescript
interface ProgresoEjercicio {
  ejercicioId: string
  pesoReal: number
  repeticionesReal: number
  volumenReal: number // Calculado: pesoReal × repeticionesReal
}
```

---

## 🧰 Funcionalidades Clave

### Para Profesores

- **CRUD de alumnos**: Crear, leer, actualizar y eliminar alumnos.
- **CRUD de rutinas por alumno**: Crear, leer, actualizar y eliminar rutinas específicas para cada alumno.
- **Reutilización de ejercicios propios**: Utilizar ejercicios guardados previamente al crear nuevas rutinas.
- **Visualización del progreso semanal por alumno**: Ver el seguimiento de cada alumno.
- **Filtros por semana, objetivo, nivel, etc.**: Filtrar y buscar información de manera eficiente.

### Para Alumnos

- **Visualización detallada de rutina y ejercicios**: Ver toda la información de su rutina asignada.
- **Registro diario/semanal de progreso**: Registrar el progreso de cada entrenamiento.
- **Comparativa de progreso histórico**: Ver evolución a lo largo del tiempo.
- **Acceso al chatbot IA personalizado**: Consultar con IA sobre su entrenamiento.

---

## 🖥️ Módulos de la Aplicación

### Auth Module

- Registro y login (profesores y alumnos).
- Roles y permisos.

### Dashboard Profesor

- Lista de alumnos.
- Crear/editar rutinas.
- Seguimiento de alumnos.
- Gestión de ejercicios propios.

### Panel Alumno

- Ver rutina actual.
- Registrar progreso diario.
- Consultar semanas anteriores.
- Chatbot con IA.

### Base de Datos

- MongoDB o PostgreSQL según preferencia.
- ORM sugerido: Prisma o Mongoose.
ö
### Chatbot AI

- Integración con API LLM (ej: OpenAI o Gemini).
- Contexto limitado a 5 semanas del alumno.

---

## 🚀 Stack Tecnológico Sugerido

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | React + Next.js + TailwindCSS |
| **Backend** | Node.js + Express / NestJS |
| **Base de Datos** | MongoDB |
| **Autenticación** | JWT + bcrypt |
| **Integración IA** | Gemini |
| **Infraestructura** | Vercel / Railway |

---

## 📋 Roadmap Sugerido

1. **Diseño de modelos y API REST**: Definir estructura de datos y endpoints.
2. **Implementación de autenticación y roles**: Sistema de login y permisos.
3. **Dashboard de profesor**: Interfaz principal para profesores.
4. **Panel de alumno y seguimiento**: Interfaz para alumnos y registro de progreso.
5. **Módulo de rutinas y ejercicios**: Gestión completa de rutinas.
6. **Integración del chatbot IA**: Conectar con API de IA.
7. **Optimización y despliegue**: Preparar para producción.

---

## ✅ Objetivo Final

Crear una plataforma profesional, moderna y escalable para la gestión de rutinas de entrenamiento personalizadas, con seguimiento progresivo e integración inteligente basada en IA.
