'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import api from '@/lib/api';
import type { Alumno } from '@/types';

interface EjercicioProfesor {
  _id?: string;
  id?: string;
  nombre: string;
  videoUrl?: string | null;
}

interface EjercicioRutina {
  nombre: string;
  videoUrl: string | null;
  series: number;
  repeticiones: number;
  peso: number | null;
  pausa: number;
}

interface Bloque {
  nombre: string;
  ejercicios: EjercicioRutina[];
}

interface DiaRutina {
  nombre: string;
  bloques: Bloque[];
}

export default function CrearRutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState<'Masculino' | 'Femenino' | 'Otro'>('Masculino');
  const [objetivo, setObjetivo] = useState('');
  const [edad, setEdad] = useState<number>(18);
  const [nivel, setNivel] = useState<'Principiante' | 'Intermedio' | 'Avanzado'>('Principiante');
  const [periodizacion, setPeriodizacion] = useState('');
  const [semanaActual, setSemanaActual] = useState<number>(1);
  const [dias, setDias] = useState<DiaRutina[]>([
    {
      nombre: 'Día 1',
      bloques: [
        {
          nombre: 'Bloque 1',
          ejercicios: []
        }
      ]
    }
  ]);

  const { data: alumno } = useQuery<Alumno>({
    queryKey: ['alumno', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/alumnos/${id}`);
      return response.data;
    },
  });

  const { data: ejercicios } = useQuery<EjercicioProfesor[]>({
    queryKey: ['ejercicios'],
    queryFn: async () => {
      const response = await api.get('/api/profesor/ejercicios');
      return response.data;
    },
  });

  interface RutinaData {
    nombre: string;
    objetivo: string;
    nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
    genero: 'Masculino' | 'Femenino' | 'Otro';
    edad: number;
    periodizacion: string;
    semanaActual: number;
    dias: Array<{
      nombre: string;
      bloques: Array<{
        nombre: string;
        ejercicios: EjercicioRutina[];
      }>;
    }>;
  }

  const createMutation = useMutation({
    mutationFn: async (data: RutinaData) => {
      return await api.post('/api/profesor/rutinas', { ...data, alumnoId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumno', id] });
      queryClient.invalidateQueries({ queryKey: ['rutina', id] });
      router.push(`/profesor/alumnos/${id}`);
    },
    onError: (err: unknown) => {
      console.error('Error al crear rutina:', err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error desconocido';
      alert('Error al crear rutina: ' + errorMessage);
    },
  });

  // Agregar día
  const agregarDia = () => {
    setDias([...dias, {
      nombre: `Día ${dias.length + 1}`,
      bloques: [{
        nombre: 'Bloque 1',
        ejercicios: []
      }]
    }]);
  };

  // Eliminar día
  const eliminarDia = (diaIndex: number) => {
    if (dias.length > 1) {
      setDias(dias.filter((_, i) => i !== diaIndex));
    }
  };

  // Agregar bloque a un día
  const agregarBloque = (diaIndex: number) => {
    const nuevosDias = [...dias];
    nuevosDias[diaIndex].bloques.push({
      nombre: `Bloque ${nuevosDias[diaIndex].bloques.length + 1}`,
      ejercicios: []
    });
    setDias(nuevosDias);
  };

  // Eliminar bloque de un día
  const eliminarBloque = (diaIndex: number, bloqueIndex: number) => {
    const nuevosDias = [...dias];
    if (nuevosDias[diaIndex].bloques.length > 1) {
      nuevosDias[diaIndex].bloques = nuevosDias[diaIndex].bloques.filter((_, i) => i !== bloqueIndex);
      setDias(nuevosDias);
    }
  };

  // Agregar ejercicio a un bloque
  const agregarEjercicio = (diaIndex: number, bloqueIndex: number) => {
    if (!ejercicios || ejercicios.length === 0) {
      alert('Primero debes crear ejercicios en tu biblioteca');
      return;
    }
    
    const nuevosDias = [...dias];
    const primerEjercicio = ejercicios[0];
    nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios.push({
      nombre: primerEjercicio.nombre,
      videoUrl: primerEjercicio.videoUrl || null,
      series: 3,
      repeticiones: 10,
      peso: null,
      pausa: 60
    });
    setDias(nuevosDias);
  };

  // Eliminar ejercicio de un bloque
  const eliminarEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number) => {
    const nuevosDias = [...dias];
    nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios = 
      nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios.filter((_, i) => i !== ejercicioIndex);
    setDias(nuevosDias);
  };

  // Actualizar nombre de día
  const actualizarNombreDia = (diaIndex: number, nuevoNombre: string) => {
    const nuevosDias = [...dias];
    nuevosDias[diaIndex].nombre = nuevoNombre;
    setDias(nuevosDias);
  };

  // Actualizar nombre de bloque
  const actualizarNombreBloque = (diaIndex: number, bloqueIndex: number, nuevoNombre: string) => {
    const nuevosDias = [...dias];
    nuevosDias[diaIndex].bloques[bloqueIndex].nombre = nuevoNombre;
    setDias(nuevosDias);
  };

  // Actualizar ejercicio
  const actualizarEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    campo: keyof EjercicioRutina,
    valor: string | number | null
  ) => {
    const nuevosDias = [...dias];
    nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex] = {
      ...nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex],
      [campo]: valor
    };
    setDias(nuevosDias);
  };

  // Seleccionar ejercicio de la biblioteca
  const seleccionarEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    ejercicioId: string
  ) => {
    const ejercicio = ejercicios?.find(e => (e._id || e.id) === ejercicioId);
    if (ejercicio) {
      const nuevosDias = [...dias];
      nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex].nombre = ejercicio.nombre;
      nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex].videoUrl = ejercicio.videoUrl || null;
      setDias(nuevosDias);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!nombre.trim()) {
      alert('El nombre de la rutina es obligatorio');
      return;
    }
    if (!objetivo.trim()) {
      alert('El objetivo es obligatorio');
      return;
    }
    if (!periodizacion.trim()) {
      alert('La periodización es obligatoria');
      return;
    }
    
    // Validar que haya al menos un ejercicio
    const tieneEjercicios = dias.some(dia => 
      dia.bloques.some(bloque => bloque.ejercicios.length > 0)
    );
    
    if (!tieneEjercicios) {
      alert('Debes agregar al menos un ejercicio a la rutina');
      return;
    }

    createMutation.mutate({
      nombre,
      genero,
      objetivo,
      edad,
      nivel,
      periodizacion,
      semanaActual,
      dias
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <Link href={`/profesor/alumnos/${id}`} className="text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 inline-block text-sm sm:text-base">
          ← Volver al alumno
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crear Nueva Rutina</h1>
        {alumno && (
          <p className="mt-2 text-sm sm:text-base text-gray-600">Para {alumno.nombre}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Rutina *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Rutina de Fuerza e Hipertrofia"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género *
              </label>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value as 'Masculino' | 'Femenino' | 'Otro')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objetivo *
              </label>
              <input
                type="text"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Ganar fuerza y masa muscular"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad *
              </label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(parseInt(e.target.value) || 18)}
                min="1"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel *
              </label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value as 'Principiante' | 'Intermedio' | 'Avanzado')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodización *
              </label>
              <input
                type="text"
                value={periodizacion}
                onChange={(e) => setPeriodizacion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 8 semanas - Fase de volumen"
                required
              />
            </div>
          </div>
        </div>

        {/* Días de la rutina */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Días de la Rutina</h2>
            <button
              type="button"
              onClick={agregarDia}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              + Agregar Día
            </button>
          </div>

          {dias.map((dia, diaIndex) => (
            <div key={diaIndex} className="mb-4 sm:mb-6 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                <input
                  type="text"
                  value={dia.nombre}
                  onChange={(e) => actualizarNombreDia(diaIndex, e.target.value)}
                  className="text-base sm:text-lg font-semibold text-gray-900 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                  placeholder="Nombre del día"
                />
                {dias.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarDia(diaIndex)}
                    className="px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full sm:w-auto"
                  >
                    Eliminar Día
                  </button>
                )}
              </div>

              {/* Bloques */}
              <div className="space-y-4">
                {dia.bloques.map((bloque, bloqueIndex) => (
                  <div key={bloqueIndex} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                      <input
                        type="text"
                        value={bloque.nombre}
                        onChange={(e) => actualizarNombreBloque(diaIndex, bloqueIndex, e.target.value)}
                        className="font-medium text-gray-900 px-2 py-1 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                        placeholder="Nombre del bloque"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => agregarEjercicio(diaIndex, bloqueIndex)}
                          className="flex-1 sm:flex-none px-3 py-1 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          + Ejercicio
                        </button>
                        {dia.bloques.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarBloque(diaIndex, bloqueIndex)}
                            className="flex-1 sm:flex-none px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ejercicios */}
                    <div className="space-y-3">
                      {bloque.ejercicios.map((ejercicio, ejercicioIndex) => (
                        <div key={ejercicioIndex} className="bg-white rounded-md p-2 sm:p-3 border border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                            <div className="sm:col-span-2 lg:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Ejercicio *
                              </label>
                              <select
                                value={ejercicios?.find(e => e.nombre === ejercicio.nombre && e.videoUrl === ejercicio.videoUrl)?._id || ejercicios?.find(e => e.nombre === ejercicio.nombre && e.videoUrl === ejercicio.videoUrl)?.id || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    seleccionarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, e.target.value);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                <option value="">Seleccionar ejercicio...</option>
                                {ejercicios?.map((ej) => (
                                  <option key={ej._id || ej.id} value={ej._id || ej.id}>
                                    {ej.nombre}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Series *
                              </label>
                              <input
                                type="number"
                                value={ejercicio.series}
                                onChange={(e) => actualizarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'series', parseInt(e.target.value) || 0)}
                                min="1"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Repeticiones *
                              </label>
                              <input
                                type="number"
                                value={ejercicio.repeticiones}
                                onChange={(e) => actualizarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'repeticiones', parseInt(e.target.value) || 0)}
                                min="1"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Pausa (seg) *
                              </label>
                              <input
                                type="number"
                                value={ejercicio.pausa}
                                onChange={(e) => actualizarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'pausa', parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-2">Peso inicial (opcional):</span>
                              <input
                                type="number"
                                step="0.5"
                                value={ejercicio.peso ?? ''}
                                onChange={(e) => actualizarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'peso', e.target.value === '' ? null : parseFloat(e.target.value))}
                                min="0"
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <span className="ml-1">kg</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => eliminarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full sm:w-auto"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                      {bloque.ejercicios.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No hay ejercicios en este bloque. Haz clic en &quot;+ Ejercicio&quot; para agregar uno.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => agregarBloque(diaIndex)}
                  className="w-full px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  + Agregar Bloque
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pb-6">
          <Link
            href={`/profesor/alumnos/${id}`}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center text-sm sm:text-base"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Rutina'}
          </button>
        </div>
      </form>
    </div>
  );
}
