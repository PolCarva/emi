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

  useEffect(() => {
    if (rutina) {
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

  // Actualizar campo general
  const updateField = (field: keyof Rutina, value: string | number) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  // Actualizar nombre de día
  const updateDiaNombre = (diaIndex: number, nombre: string) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex] = { ...newDias[diaIndex], nombre };
    setFormData({ ...formData, dias: newDias });
  };

  // Actualizar nombre de bloque
  const updateBloqueNombre = (diaIndex: number, bloqueIndex: number, nombre: string) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex].bloques[bloqueIndex] = { ...newDias[diaIndex].bloques[bloqueIndex], nombre };
    setFormData({ ...formData, dias: newDias });
  };

  // Actualizar ejercicio
  const updateEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    field: 'nombre' | 'series' | 'repeticiones' | 'peso' | 'pausa',
    value: string | number | null
  ) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const ejercicio = { ...newDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex] };
    
    if (field === 'peso') {
      ejercicio.peso = value === '' ? null : (typeof value === 'number' ? value : parseFloat(String(value)) || null);
      ejercicio.volumen = ejercicio.peso !== null ? ejercicio.series * ejercicio.repeticiones * ejercicio.peso : 0;
    } else if (field === 'series') {
      ejercicio.series = typeof value === 'number' ? value : parseInt(String(value));
      if (ejercicio.peso !== null) {
        ejercicio.volumen = ejercicio.series * ejercicio.repeticiones * ejercicio.peso;
      }
    } else if (field === 'repeticiones') {
      ejercicio.repeticiones = typeof value === 'number' ? value : parseInt(String(value));
      if (ejercicio.peso !== null) {
        ejercicio.volumen = ejercicio.series * ejercicio.repeticiones * ejercicio.peso;
      }
    } else if (field === 'pausa') {
      ejercicio.pausa = typeof value === 'number' ? value : parseInt(String(value));
    } else if (field === 'nombre') {
      ejercicio.nombre = String(value);
    }
    
    newDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex] = ejercicio;
    setFormData({ ...formData, dias: newDias });
  };

  // Seleccionar ejercicio de la biblioteca
  const selectEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number, ejercicioId: string) => {
    if (!formData || !formData.dias || !ejerciciosProfesor) return;
    const ejercicio = ejerciciosProfesor.find(ej => (ej._id || ej.id) === ejercicioId);
    if (!ejercicio) return;

    const newDias = [...formData.dias];
    newDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex] = {
      ...newDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex],
      nombre: ejercicio.nombre,
      videoUrl: ejercicio.videoUrl ?? null,
    };
    setFormData({ ...formData, dias: newDias });
  };

  // Mover ejercicio dentro del bloque
  const moverEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number, direccion: 'arriba' | 'abajo') => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const ejercicios = [...newDias[diaIndex].bloques[bloqueIndex].ejercicios];
    const nuevoIndex = direccion === 'arriba' ? ejercicioIndex - 1 : ejercicioIndex + 1;
    
    if (nuevoIndex < 0 || nuevoIndex >= ejercicios.length) return;
    
    [ejercicios[ejercicioIndex], ejercicios[nuevoIndex]] = [ejercicios[nuevoIndex], ejercicios[ejercicioIndex]];
    newDias[diaIndex].bloques[bloqueIndex].ejercicios = ejercicios;
    setFormData({ ...formData, dias: newDias });
  };

  // Agregar día
  const agregarDia = () => {
    if (!formData) return;
    const newDias = formData.dias ? [...formData.dias] : [];
    newDias.push({ nombre: '', bloques: [] });
    setFormData({ ...formData, dias: newDias });
  };

  // Eliminar día
  const eliminarDia = (diaIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias.splice(diaIndex, 1);
    setFormData({ ...formData, dias: newDias });
  };

  // Agregar bloque
  const agregarBloque = (diaIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex].bloques.push({ nombre: '', ejercicios: [] });
    setFormData({ ...formData, dias: newDias });
  };

  // Eliminar bloque
  const eliminarBloque = (diaIndex: number, bloqueIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex].bloques.splice(bloqueIndex, 1);
    setFormData({ ...formData, dias: newDias });
  };

  // Agregar ejercicio
  const agregarEjercicio = (diaIndex: number, bloqueIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    const primerEjercicio = ejerciciosProfesor && ejerciciosProfesor.length > 0 ? ejerciciosProfesor[0] : null;
    
    newDias[diaIndex].bloques[bloqueIndex].ejercicios.push({
      nombre: primerEjercicio?.nombre || '',
      videoUrl: primerEjercicio?.videoUrl ?? null,
      series: 3,
      repeticiones: 10,
      peso: null,
      pausa: 60,
      volumen: 0
    });
    setFormData({ ...formData, dias: newDias });
  };

  // Eliminar ejercicio
  const eliminarEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number) => {
    if (!formData || !formData.dias) return;
    const newDias = [...formData.dias];
    newDias[diaIndex].bloques[bloqueIndex].ejercicios.splice(ejercicioIndex, 1);
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la rutina</label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => updateField('nombre', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
              <input
                type="text"
                value={formData.objetivo || ''}
                onChange={(e) => updateField('objetivo', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <select
                value={formData.nivel || ''}
                onChange={(e) => updateField('nivel', e.target.value)}
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
                onChange={(e) => updateField('periodizacion', e.target.value)}
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
                onChange={(e) => updateField('semanaActual', parseInt(e.target.value))}
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
                No tienes ejercicios creados.{' '}
                <Link href="/profesor/ejercicios" className="text-blue-600 hover:text-blue-700">
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
                      onChange={(e) => updateDiaNombre(diaIndex, e.target.value)}
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
                            onChange={(e) => updateBloqueNombre(diaIndex, bloqueIndex, e.target.value)}
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
                        {bloque.ejercicios.map((ejercicio, ejercicioIndex) => {
                          const ejercicioActual = ejerciciosProfesor?.find(
                            ej => ej.nombre === ejercicio.nombre && ej.videoUrl === ejercicio.videoUrl
                          );
                          const ejercicioIdSeleccionado = ejercicioActual ? (ejercicioActual._id || ejercicioActual.id) : '';

                          return (
                            <div key={ejercicioIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Ejercicio</label>
                                  <SearchableSelect
                                    options={ejerciciosProfesor?.map(ej => ({
                                      value: ej._id || ej.id || '',
                                      label: ej.nombre
                                    })) || []}
                                    value={ejercicioIdSeleccionado || ''}
                                    onChange={(value) => {
                                      if (value) selectEjercicio(diaIndex, bloqueIndex, ejercicioIndex, value);
                                    }}
                                    placeholder="Buscar ejercicio..."
                                    required
                                  />
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => moverEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'arriba')}
                                    disabled={ejercicioIndex === 0}
                                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1"
                                    title="Mover arriba"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moverEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'abajo')}
                                    disabled={ejercicioIndex === bloque.ejercicios.length - 1}
                                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1"
                                    title="Mover abajo"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                                    className="text-red-600 hover:text-red-700 px-2 py-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Series</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={ejercicio.series || ''}
                                    onChange={(e) => updateEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'series', parseInt(e.target.value) || 0)}
                                    required
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Repeticiones</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={ejercicio.repeticiones || ''}
                                    onChange={(e) => updateEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'repeticiones', parseInt(e.target.value) || 0)}
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
                                    onChange={(e) => updateEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'peso', e.target.value === '' ? null : parseFloat(e.target.value) || null)}
                                    placeholder="Sin definir"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Pausa (s)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={ejercicio.pausa || ''}
                                    onChange={(e) => updateEjercicio(diaIndex, bloqueIndex, ejercicioIndex, 'pausa', parseInt(e.target.value) || 0)}
                                    required
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                Volumen: <span className="font-medium text-blue-600">{ejercicio.volumen.toLocaleString()} kg</span>
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
                    className="ml-4 text-sm py-2 px-3 border border-dashed rounded-md transition-colors text-blue-600 hover:text-blue-700 border-blue-300"
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
