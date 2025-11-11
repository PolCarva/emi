'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import api from '@/lib/api';
import type { Rutina, DiaRutina, Bloque } from '@/types';
import SearchableSelect from '@/components/common/SearchableSelect';

interface EjercicioProfesor {
  _id?: string;
  id?: string;
  nombre: string;
  videoUrl?: string | null;
}

export default function EditarRutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: rutina, isLoading } = useQuery<Rutina>({
    queryKey: ['rutina-profesor', id],
    queryFn: async () => {
      const response = await api.get(`/api/profesor/rutinas/${id}`);
      return response.data;
    },
  });

  const { data: ejerciciosProfesor } = useQuery<EjercicioProfesor[]>({
    queryKey: ['ejercicios'],
    queryFn: async () => {
      const response = await api.get('/api/profesor/ejercicios');
      return response.data;
    },
  });

  const [formData, setFormData] = useState<Partial<Rutina> | null>(null);
  const [ejerciciosEditando, setEjerciciosEditando] = useState<Set<string>>(new Set());
  // Estado para selección múltiple de ejercicios (clave: `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`)
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (rutina) {
      // Usar setTimeout para evitar setState síncrono en effect
      setTimeout(() => {
        setFormData({
          nombre: rutina.nombre,
          objetivo: rutina.objetivo,
          nivel: rutina.nivel,
          genero: rutina.genero,
          edad: rutina.edad,
          periodizacion: rutina.periodizacion,
          semanaActual: rutina.semanaActual,
          dias: rutina.dias.map(dia => ({
            nombre: dia.nombre,
            bloques: dia.bloques.map(bloque => ({
              nombre: bloque.nombre,
              ejercicios: bloque.ejercicios.map(ej => ({
                nombre: ej.nombre,
                videoUrl: ej.videoUrl,
                series: ej.series,
                repeticiones: ej.repeticiones,
                peso: ej.peso,
                pausa: ej.pausa,
                volumen: ej.volumen
              }))
            }))
          }))
        });
      }, 0);
    }
  }, [rutina]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Rutina>) => {
      return await api.put(`/api/profesor/rutinas/${rutina?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutina-profesor', id] });
      queryClient.invalidateQueries({ queryKey: ['rutina', id] });
      queryClient.invalidateQueries({ queryKey: ['alumno', id] });
      alert('Rutina actualizada correctamente');
      router.push(`/profesor/alumnos/${id}`);
    },
    onError: (err: unknown) => {
      console.error('Error al actualizar rutina:', err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error desconocido';
      alert('Error al actualizar rutina: ' + errorMessage);
    },
  });

  const handleInputChange = (field: keyof Rutina, value: string | number) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleDiaChange = (diaIndex: number, field: keyof DiaRutina, value: string) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex] = { ...newDias[diaIndex], [field]: value };
    setFormData({ ...formData, dias: newDias });
  };

  const handleBloqueChange = (diaIndex: number, bloqueIndex: number, field: keyof Bloque, value: string) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    newBloques[bloqueIndex] = { ...newBloques[bloqueIndex], [field]: value };
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });
  };

  const handleEjercicioSeleccionar = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    ejercicioId: string
  ) => {
    if (!formData || !formData.dias || !ejerciciosProfesor) return;
    
    const ejercicioSeleccionado = ejerciciosProfesor.find(
      ej => (ej._id || ej.id) === ejercicioId
    );
    
    if (!ejercicioSeleccionado) return;

    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    const newEjercicios = [...newBloques[bloqueIndex].ejercicios];
    
    newEjercicios[ejercicioIndex] = {
      ...newEjercicios[ejercicioIndex],
      nombre: ejercicioSeleccionado.nombre,
      videoUrl: ejercicioSeleccionado.videoUrl ?? null,
      // Mantener series, repeticiones, peso y pausa existentes
    };
    
    newBloques[bloqueIndex] = { ...newBloques[bloqueIndex], ejercicios: newEjercicios };
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });
  };

  const handleEjercicioChange = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    field: 'series' | 'repeticiones' | 'peso' | 'pausa',
    value: number | string
  ) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    const newEjercicios = [...newBloques[bloqueIndex].ejercicios];
    const ejercicio = { ...newEjercicios[ejercicioIndex] };
    
    if (field === 'peso') {
      ejercicio.peso = value === '' ? null : parseFloat(String(value)) || null;
      ejercicio.volumen = ejercicio.peso !== null && ejercicio.peso !== undefined
        ? ejercicio.series * ejercicio.repeticiones * ejercicio.peso
        : 0;
    } else {
      ejercicio[field] = typeof value === 'number' ? value : parseInt(String(value));
      if ((field === 'series' || field === 'repeticiones') && ejercicio.peso !== null) {
        ejercicio.volumen = ejercicio.series * ejercicio.repeticiones * (ejercicio.peso || 0);
      }
    }
    
    newEjercicios[ejercicioIndex] = ejercicio;
    newBloques[bloqueIndex] = { ...newBloques[bloqueIndex], ejercicios: newEjercicios };
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });
  };

  const moverEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    direccion: 'arriba' | 'abajo'
  ) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    const newEjercicios = [...newBloques[bloqueIndex].ejercicios];
    
    const nuevoIndex = direccion === 'arriba' ? ejercicioIndex - 1 : ejercicioIndex + 1;
    if (nuevoIndex < 0 || nuevoIndex >= newEjercicios.length) return;
    
    [newEjercicios[ejercicioIndex], newEjercicios[nuevoIndex]] = 
      [newEjercicios[nuevoIndex], newEjercicios[ejercicioIndex]];
    
    newBloques[bloqueIndex] = { ...newBloques[bloqueIndex], ejercicios: newEjercicios };
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });
  };

  const agregarEjercicio = (diaIndex: number, bloqueIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    
    // Si hay ejercicios disponibles, usar el primero; si no, crear uno vacío
    const primerEjercicio = ejerciciosProfesor && ejerciciosProfesor.length > 0
      ? ejerciciosProfesor[0]
      : null;
    
    const nuevoEjercicioIndex = newBloques[bloqueIndex].ejercicios.length;
    
    newBloques[bloqueIndex].ejercicios.push({
      nombre: primerEjercicio?.nombre || '',
      videoUrl: primerEjercicio?.videoUrl ?? null,
      series: 3,
      repeticiones: 10,
      peso: null,
      pausa: 60,
      volumen: 0
    });
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });
    
    // Activar modo edición para el nuevo ejercicio
    const key = `${diaIndex}-${bloqueIndex}-${nuevoEjercicioIndex}`;
    setEjerciciosEditando(prev => new Set(prev).add(key));
  };

  const eliminarEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    newBloques[bloqueIndex].ejercicios.splice(ejercicioIndex, 1);
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });
    
    // Remover del conjunto de edición
    const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    setEjerciciosEditando(prev => {
      const nuevo = new Set(prev);
      nuevo.delete(key);
      return nuevo;
    });

    // Limpiar selección del ejercicio eliminado
    setEjerciciosSeleccionados(prev => {
      const nuevo = new Set(prev);
      nuevo.delete(key);
      // Ajustar índices de ejercicios posteriores
      const nuevosKeys = new Set<string>();
      prev.forEach(k => {
        const [d, b, e] = k.split('-').map(Number);
        if (d === diaIndex && b === bloqueIndex) {
          if (e < ejercicioIndex) {
            nuevosKeys.add(k);
          } else if (e > ejercicioIndex) {
            nuevosKeys.add(`${d}-${b}-${e - 1}`);
          }
        } else {
          nuevosKeys.add(k);
        }
      });
      return nuevosKeys;
    });
  };

  // Toggle selección de un ejercicio
  const toggleSeleccionEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number) => {
    const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    setEjerciciosSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) {
        nuevo.delete(key);
      } else {
        nuevo.add(key);
      }
      return nuevo;
    });
  };

  // Seleccionar/deseleccionar todos los ejercicios de un bloque
  const toggleSeleccionarTodosBloque = (diaIndex: number, bloqueIndex: number) => {
    if (!formData || !formData.dias) return;
    const bloque = formData.dias[diaIndex]?.bloques[bloqueIndex];
    if (!bloque) return;

    const todosSeleccionados = bloque.ejercicios.every((_, ejercicioIndex) => {
      const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
      return ejerciciosSeleccionados.has(key);
    });

    setEjerciciosSeleccionados(prev => {
      const nuevo = new Set(prev);
      bloque.ejercicios.forEach((_, ejercicioIndex) => {
        const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
        if (todosSeleccionados) {
          nuevo.delete(key);
        } else {
          nuevo.add(key);
        }
      });
      return nuevo;
    });
  };

  // Eliminar ejercicios seleccionados de un bloque
  const eliminarEjerciciosSeleccionados = (diaIndex: number, bloqueIndex: number) => {
    if (!formData || !formData.dias) return;
    const bloque = formData.dias[diaIndex]?.bloques[bloqueIndex];
    if (!bloque) return;

    const indicesAEliminar = bloque.ejercicios
      .map((_, ejercicioIndex) => {
        const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
        return ejerciciosSeleccionados.has(key) ? ejercicioIndex : null;
      })
      .filter((index): index is number => index !== null)
      .sort((a, b) => b - a); // Ordenar descendente para eliminar desde el final

    if (indicesAEliminar.length === 0) return;

    const newDias = [...formData.dias];
    const newBloques = [...newDias[diaIndex].bloques];
    indicesAEliminar.forEach(index => {
      newBloques[bloqueIndex].ejercicios.splice(index, 1);
    });
    newDias[diaIndex] = { ...newDias[diaIndex], bloques: newBloques };
    setFormData({ ...formData, dias: newDias });

    // Limpiar selecciones eliminadas y ajustar índices
    setEjerciciosSeleccionados(prev => {
      const nuevo = new Set(prev);
      indicesAEliminar.forEach(index => {
        const key = `${diaIndex}-${bloqueIndex}-${index}`;
        nuevo.delete(key);
      });
      // Ajustar índices de ejercicios restantes
      const nuevosKeys = new Set<string>();
      prev.forEach(k => {
        const [d, b, e] = k.split('-').map(Number);
        if (d === diaIndex && b === bloqueIndex) {
          const ejercicioIndex = Number(e);
          if (!indicesAEliminar.includes(ejercicioIndex)) {
            // Calcular nuevo índice después de las eliminaciones
            const eliminadosAntes = indicesAEliminar.filter(i => i > ejercicioIndex).length;
            nuevosKeys.add(`${d}-${b}-${ejercicioIndex - eliminadosAntes}`);
          }
        } else {
          nuevosKeys.add(k);
        }
      });
      return nuevosKeys;
    });

    // También limpiar del conjunto de edición
    setEjerciciosEditando(prev => {
      const nuevo = new Set(prev);
      indicesAEliminar.forEach(index => {
        const key = `${diaIndex}-${bloqueIndex}-${index}`;
        nuevo.delete(key);
      });
      // Ajustar índices de ejercicios restantes
      const nuevosKeys = new Set<string>();
      prev.forEach(k => {
        const [d, b, e] = k.split('-').map(Number);
        if (d === diaIndex && b === bloqueIndex) {
          const ejercicioIndex = Number(e);
          if (!indicesAEliminar.includes(ejercicioIndex)) {
            const eliminadosAntes = indicesAEliminar.filter(i => i > ejercicioIndex).length;
            nuevosKeys.add(`${d}-${b}-${ejercicioIndex - eliminadosAntes}`);
          }
        } else {
          nuevosKeys.add(k);
        }
      });
      return nuevosKeys;
    });
  };

  const toggleEditarEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number) => {
    const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    setEjerciciosEditando(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) {
        nuevo.delete(key);
      } else {
        nuevo.add(key);
      }
      return nuevo;
    });
  };

  const isEjercicioEditando = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number): boolean => {
    const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    return ejerciciosEditando.has(key);
  };

  const agregarBloque = (diaIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex].bloques.push({
      nombre: '',
      ejercicios: []
    });
    setFormData({ ...formData, dias: newDias });
  };

  const eliminarBloque = (diaIndex: number, bloqueIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex].bloques.splice(bloqueIndex, 1);
    setFormData({ ...formData, dias: newDias });
  };

  const agregarDia = () => {
    if (!formData) return;
    const newDias = formData.dias ? [...formData.dias] : [];
    newDias.push({
      nombre: '',
      bloques: []
    });
    setFormData({ ...formData, dias: newDias });
  };

  const eliminarDia = (diaIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias.splice(diaIndex, 1);
    setFormData({ ...formData, dias: newDias });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  if (isLoading || !formData) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rutina) {
    return (
      <div className="px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Rutina no encontrada</p>
          <Link href={`/profesor/alumnos/${id}`} className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Volver al alumno
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <Link href={`/profesor/alumnos/${id}`} className="text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 inline-block text-sm sm:text-base">
          ← Volver al alumno
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Editar Rutina</h1>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Selecciona ejercicios de tu biblioteca y ajusta series, repeticiones y peso
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Información General */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la rutina</label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
              <input
                type="text"
                value={formData.objetivo || ''}
                onChange={(e) => handleInputChange('objetivo', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <select
                value={formData.nivel || ''}
                onChange={(e) => handleInputChange('nivel', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodización</label>
              <input
                type="text"
                value={formData.periodizacion || ''}
                onChange={(e) => handleInputChange('periodizacion', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semana Actual</label>
              <input
                type="number"
                min="1"
                value={formData.semanaActual || 1}
                onChange={(e) => handleInputChange('semanaActual', parseInt(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Días de Entrenamiento */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Días de Entrenamiento</h2>
            <button
              type="button"
              onClick={agregarDia}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              + Agregar Día
            </button>
          </div>

          {!ejerciciosProfesor || ejerciciosProfesor.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                No tienes ejercicios creados. 
                <Link href="/profesor/ejercicios" className="text-blue-600 hover:text-blue-700 ml-1">
                  Crea ejercicios primero
                </Link>
              </p>
            </div>
          ) : null}

          <div className="space-y-6">
            {formData.dias?.map((dia, diaIndex) => (
              <div key={diaIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Día</label>
                    <input
                      type="text"
                      value={dia.nombre}
                      onChange={(e) => handleDiaChange(diaIndex, 'nombre', e.target.value)}
                      required
                      placeholder="Ej: Día 1: Pecho y Tríceps"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarDia(diaIndex)}
                    className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                  >
                    Eliminar Día
                  </button>
                </div>

                <div className="space-y-4">
                  {dia.bloques.map((bloque, bloqueIndex) => (
                    <div key={bloqueIndex} className="ml-4 border-l-2 border-blue-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Bloque</label>
                          <input
                            type="text"
                            value={bloque.nombre}
                            onChange={(e) => handleBloqueChange(diaIndex, bloqueIndex, 'nombre', e.target.value)}
                            required
                            placeholder="Ej: Bloque 1: Pecho"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarBloque(diaIndex, bloqueIndex)}
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                        >
                          Eliminar Bloque
                        </button>
                      </div>

                      <div className="space-y-3 mt-3">
                        {/* Controles de selección múltiple */}
                        {bloque.ejercicios.length > 0 && (
                          <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 rounded-md border border-gray-200">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={bloque.ejercicios.every((_, ejercicioIndex) => {
                                  const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                                  return ejerciciosSeleccionados.has(key);
                                })}
                                onChange={() => toggleSeleccionarTodosBloque(diaIndex, bloqueIndex)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span>
                                {bloque.ejercicios.some((_, ejercicioIndex) => {
                                  const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                                  return ejerciciosSeleccionados.has(key);
                                })
                                  ? `${bloque.ejercicios.filter((_, ejercicioIndex) => {
                                      const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                                      return ejerciciosSeleccionados.has(key);
                                    }).length} seleccionado(s)`
                                  : 'Seleccionar todos'}
                              </span>
                            </label>
                            {bloque.ejercicios.some((_, ejercicioIndex) => {
                              const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                              return ejerciciosSeleccionados.has(key);
                            }) && (
                              <button
                                type="button"
                                onClick={() => eliminarEjerciciosSeleccionados(diaIndex, bloqueIndex)}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                Eliminar seleccionados
                              </button>
                            )}
                          </div>
                        )}
                        {bloque.ejercicios.map((ejercicio, ejercicioIndex) => {
                          const estaEditando = isEjercicioEditando(diaIndex, bloqueIndex, ejercicioIndex);
                          const ejercicioActual = ejerciciosProfesor?.find(ej => 
                            ej.nombre === ejercicio.nombre && ej.videoUrl === ejercicio.videoUrl
                          );
                          const ejercicioIdSeleccionado = ejercicioActual ? (ejercicioActual._id || ejercicioActual.id) : '';
                          const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                          const estaSeleccionado = ejerciciosSeleccionados.has(key);

                          return (
                            <div key={ejercicioIndex} className={`bg-gray-50 rounded-lg p-4 border-2 transition-colors ${estaSeleccionado ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}>
                              <div className="flex items-start gap-2 mb-3">
                                <input
                                  type="checkbox"
                                  checked={estaSeleccionado}
                                  onChange={() => toggleSeleccionEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </div>
                              <div className="space-y-3">
                                {/* Selector de ejercicio - siempre visible */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Ejercicio
                                  </label>
                                  {ejercicio.nombre && !ejercicioActual ? (
                                    <div className="w-full px-2 py-1 text-sm border border-yellow-300 bg-yellow-50 rounded-md text-yellow-800">
                                      {ejercicio.nombre} (no disponible en tu biblioteca)
                                    </div>
                                  ) : (
                                    <SearchableSelect
                                      options={ejerciciosProfesor?.map(ej => ({
                                        value: ej._id || ej.id || '',
                                        label: ej.nombre
                                      })) || []}
                                      value={ejercicioIdSeleccionado || ''}
                                      onChange={(value) => {
                                        if (value) {
                                          handleEjercicioSeleccionar(diaIndex, bloqueIndex, ejercicioIndex, value);
                                        }
                                      }}
                                      placeholder="Buscar ejercicio..."
                                      required
                                    />
                                  )}
                                  {ejercicio.nombre && (
                                    <div className="mt-1">
                                      <p className="text-xs text-gray-500">
                                        {ejercicioActual ? 'Ejercicio seleccionado' : '⚠️ Ejercicio no encontrado en tu biblioteca'}
                                      </p>
                                      {ejercicio.videoUrl && (
                                        <a
                                          href={ejercicio.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-700"
                                        >
                                          Ver video →
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Información del ejercicio - modo visualización o edición */}
                                {estaEditando ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Series</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={ejercicio.series}
                                          onChange={(e) => handleEjercicioChange(diaIndex, bloqueIndex, ejercicioIndex, 'series', parseInt(e.target.value))}
                                          required
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Repeticiones</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={ejercicio.repeticiones}
                                          onChange={(e) => handleEjercicioChange(diaIndex, bloqueIndex, ejercicioIndex, 'repeticiones', parseInt(e.target.value))}
                                          required
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg) - Opcional</label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          min="0"
                                          value={ejercicio.peso ?? ''}
                                          onChange={(e) => handleEjercicioChange(diaIndex, bloqueIndex, ejercicioIndex, 'peso', e.target.value)}
                                          placeholder="Sin definir"
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Pausa (s)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={ejercicio.pausa}
                                          onChange={(e) => handleEjercicioChange(diaIndex, bloqueIndex, ejercicioIndex, 'pausa', parseInt(e.target.value))}
                                          required
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Volumen: <span className="font-medium text-blue-600">{ejercicio.volumen.toLocaleString()} kg</span>
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleEditarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                                        className="text-xs text-gray-600 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                                      >
                                        Guardar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <span className="text-gray-500">Series:</span>
                                        <span className="ml-2 font-medium">{ejercicio.series}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Reps:</span>
                                        <span className="ml-2 font-medium">{ejercicio.repeticiones}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Peso:</span>
                                        <span className="ml-2 font-medium">
                                          {ejercicio.peso !== null ? `${ejercicio.peso} kg` : 'Sin definir'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Pausa:</span>
                                        <span className="ml-2 font-medium">{ejercicio.pausa}s</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Volumen: <span className="font-medium text-blue-600">{ejercicio.volumen.toLocaleString()} kg</span>
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleEditarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                                        className="text-xs text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Botones de acción - siempre visibles */}
                                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() => moverEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'arriba')}
                                    disabled={ejercicioIndex === 0}
                                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1"
                                    title="Mover arriba"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moverEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'abajo')}
                                    disabled={ejercicioIndex === bloque.ejercicios.length - 1}
                                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1"
                                    title="Mover abajo"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => agregarEjercicio(diaIndex, bloqueIndex)}
                          disabled={!ejerciciosProfesor || ejerciciosProfesor.length === 0}
                          className="w-full text-blue-600 hover:text-blue-700 text-sm py-2 border border-dashed border-blue-300 rounded-md disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                        >
                          + Agregar Ejercicio
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => agregarBloque(diaIndex)}
                    className="ml-4 text-blue-600 hover:text-blue-700 text-sm py-2 px-3 border border-dashed border-blue-300 rounded-md"
                  >
                    + Agregar Bloque
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
          <Link
            href={`/profesor/alumnos/${id}`}
            className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2 rounded-md hover:bg-gray-200 transition-colors text-center text-sm sm:text-base"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
