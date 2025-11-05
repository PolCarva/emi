// Tipos de usuarios
export interface Profesor {
  id: string;
  nombre: string;
  email: string;
  alumnos: string[];
  ejercicios: Ejercicio[];
}

export interface Alumno {
  id: string;
  nombre: string;
  email: string;
  profesorId: string;
  rutinaActualId: string;
  historialSemanas: SemanaProgreso[];
}

// Tipos de rutina
export interface Rutina {
  id: string;
  alumnoId: string;
  profesorId: string;
  nombre: string;
  genero: 'Masculino' | 'Femenino' | 'Otro';
  objetivo: string;
  edad: number;
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
  periodizacion: string;
  semanaActual: number;
  dias: DiaRutina[];
}

export interface DiaRutina {
  nombre: string;
  bloques: Bloque[];
}

export interface Bloque {
  nombre: string;
  ejercicios: Ejercicio[];
}

export interface Ejercicio {
  nombre: string;
  videoUrl: string;
  series: number;
  repeticiones: number;
  peso: number | null;
  pausa: number;
  volumen: number;
}

// Tipos de progreso
export interface SemanaProgreso {
  numeroSemana: number;
  dias: ProgresoDia[];
}

export interface ProgresoDia {
  fecha: string;
  observaciones: string;
  ejercicios: ProgresoEjercicio[];
}

export interface ProgresoEjercicio {
  ejercicioId: string;
  pesoReal: number;
  repeticionesReal: number;
  volumenReal: number;
}

// Tipos de autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  role: 'profesor' | 'alumno';
  profesorId?: string;
}

export interface AuthResponse {
  token: string;
  user: Profesor | Alumno;
  role: 'profesor' | 'alumno';
}

