'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  
  // Estado para drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Sensores para drag and drop
  // Configurar delay para evitar activación accidental al escribir en inputs
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de activar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutación para crear ejercicio
  const createEjercicioMutation = useMutation({
    mutationFn: async (data: { nombre: string; videoUrl?: string | null }) => {
      return await api.post('/api/profesor/ejercicios', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      setShowCrearEjercicio(false);
      setNuevoEjercicioNombre('');
      setNuevoEjercicioVideoUrl('');
      setEjercicioError('');
      
      // Si hay un contexto, seleccionar automáticamente el nuevo ejercicio
      if (ejercicioContexto) {
        const nuevoEjercicioId = data.data._id || data.data.id;
        if (nuevoEjercicioId) {
          setTimeout(() => {
            handleEjercicioSeleccionar(
              ejercicioContexto.diaIndex,
              ejercicioContexto.bloqueIndex,
              ejercicioContexto.ejercicioIndex,
              nuevoEjercicioId
            );
          }, 100);
        }
      }
      setEjercicioContexto(null);
    },
    onError: (err: unknown) => {
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al crear ejercicio';
      setEjercicioError(errorMessage);
    },
  });

  // Estados para crear ejercicio desde la rutina
  const [showCrearEjercicio, setShowCrearEjercicio] = useState(false);
  const [nuevoEjercicioNombre, setNuevoEjercicioNombre] = useState('');
  const [nuevoEjercicioVideoUrl, setNuevoEjercicioVideoUrl] = useState('');
  const [ejercicioError, setEjercicioError] = useState('');
  const [ejercicioContexto, setEjercicioContexto] = useState<{
    diaIndex: number;
    bloqueIndex: number;
    ejercicioIndex: number;
  } | null>(null);

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

  // Abrir formulario para crear ejercicio
  const abrirCrearEjercicio = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number
  ) => {
    setEjercicioContexto({ diaIndex, bloqueIndex, ejercicioIndex });
    setShowCrearEjercicio(true);
    setEjercicioError('');
  };

  // Crear nuevo ejercicio
  const handleCrearEjercicio = (e: React.FormEvent) => {
    e.preventDefault();
    setEjercicioError('');
    
    if (!nuevoEjercicioNombre.trim()) {
      setEjercicioError('El nombre del ejercicio es requerido');
      return;
    }

    const videoUrlFinal = nuevoEjercicioVideoUrl.trim() || null;
    createEjercicioMutation.mutate({ nombre: nuevoEjercicioNombre.trim(), videoUrl: videoUrlFinal });
  };

  const handleEjercicioChange = (
    diaIndex: number,
    bloqueIndex: number,
    ejercicioIndex: number,
    field: 'series' | 'repeticiones' | 'peso' | 'pausa',
    value: number | string
  ) => {
    if (!formData || !formData.dias) return;
    
    // Guardar el elemento activo antes del cambio
    const activeElement = document.activeElement as HTMLInputElement | null;
    const shouldRestoreFocus = activeElement && activeElement.tagName === 'INPUT';
    
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
    
    // Guardar posición del scroll
    const scrollY = window.scrollY;
    
    // Restaurar el focus y scroll después del re-render
    if (shouldRestoreFocus && activeElement) {
      requestAnimationFrame(() => {
        // Restaurar scroll primero
        window.scrollTo(0, scrollY);
        
        // Luego restaurar focus
        const input = document.querySelector(`input[data-ejercicio-id="${diaIndex}-${bloqueIndex}-${ejercicioIndex}-${field}"]`) as HTMLInputElement;
        if (input) {
          input.focus();
          // Restaurar la posición del cursor si es posible
          if (activeElement.selectionStart !== null) {
            input.setSelectionRange(activeElement.selectionStart, activeElement.selectionEnd || activeElement.selectionStart);
          }
        }
      });
    } else {
      // Aún restaurar scroll aunque no haya focus
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
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

  // Manejar inicio del drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Manejar final del drag (drop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !formData || !formData.dias) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Parsear IDs: formato "ejercicio-{diaIndex}-{bloqueIndex}-{ejercicioIndex}" o "bloque-{diaIndex}-{bloqueIndex}"
    const parseEjercicioId = (id: string) => {
      const match = id.match(/^ejercicio-(\d+)-(\d+)-(\d+)$/);
      if (match) {
        return {
          tipo: 'ejercicio' as const,
          diaIndex: parseInt(match[1]),
          bloqueIndex: parseInt(match[2]),
          ejercicioIndex: parseInt(match[3]),
        };
      }
      return null;
    };

    const parseBloqueId = (id: string) => {
      const match = id.match(/^bloque-(\d+)-(\d+)$/);
      if (match) {
        return {
          tipo: 'bloque' as const,
          diaIndex: parseInt(match[1]),
          bloqueIndex: parseInt(match[2]),
        };
      }
      return null;
    };

    const activeData = parseEjercicioId(activeId);
    if (!activeData) return;

    const newDias = [...formData.dias];

    // Si se suelta sobre otro ejercicio, mover dentro del mismo bloque o a otro bloque
    const overEjercicioData = parseEjercicioId(overId);
    if (overEjercicioData) {
      // Si es el mismo bloque, solo reordenar
      if (activeData.diaIndex === overEjercicioData.diaIndex && 
          activeData.bloqueIndex === overEjercicioData.bloqueIndex) {
        const bloque = newDias[activeData.diaIndex].bloques[activeData.bloqueIndex];
        const ejercicios = arrayMove(
          bloque.ejercicios,
          activeData.ejercicioIndex,
          overEjercicioData.ejercicioIndex
        );
        newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios = ejercicios;
      } else {
        // Mover a otro bloque
        const ejercicio = newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
        newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
        newDias[overEjercicioData.diaIndex].bloques[overEjercicioData.bloqueIndex].ejercicios.splice(overEjercicioData.ejercicioIndex, 0, ejercicio);
      }
      
      setFormData({ ...formData, dias: newDias });
      return;
    }

    // Si se suelta sobre un bloque
    const overBloqueData = parseBloqueId(overId);
    if (overBloqueData) {
      // Si es el mismo bloque, no hacer nada (ya se maneja arriba)
      if (activeData.diaIndex === overBloqueData.diaIndex && 
          activeData.bloqueIndex === overBloqueData.bloqueIndex) {
        return;
      }

      // Mover ejercicio a otro bloque
      const ejercicio = newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
      newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
      newDias[overBloqueData.diaIndex].bloques[overBloqueData.bloqueIndex].ejercicios.push(ejercicio);
      
      setFormData({ ...formData, dias: newDias });
      return;
    }

    // Si se suelta sobre un área de día (crear nuevo bloque)
    const parseDiaId = (id: string) => {
      const match = id.match(/^dia-(\d+)$/);
      if (match) {
        return {
          tipo: 'dia' as const,
          diaIndex: parseInt(match[1]),
        };
      }
      return null;
    };

    const overDiaData = parseDiaId(overId);
    if (overDiaData) {
      // Crear nuevo bloque en el día destino
      const ejercicio = newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
      newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
      
      const nuevoBloque = {
        nombre: `Bloque ${newDias[overDiaData.diaIndex].bloques.length + 1}`,
        ejercicios: [ejercicio]
      };
      newDias[overDiaData.diaIndex].bloques.push(nuevoBloque);
      
      setFormData({ ...formData, dias: newDias });
      return;
    }

    // Si se suelta sobre el botón "Agregar Bloque"
    const parseAgregarBloqueId = (id: string) => {
      const match = id.match(/^agregar-bloque-(\d+)$/);
      if (match) {
        return {
          tipo: 'agregar-bloque' as const,
          diaIndex: parseInt(match[1]),
        };
      }
      return null;
    };

    const overAgregarBloqueData = parseAgregarBloqueId(overId);
    if (overAgregarBloqueData) {
      // Crear nuevo bloque con el ejercicio arrastrado
      const ejercicio = newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
      newDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
      
      const nuevoBloque = {
        nombre: `Bloque ${newDias[overAgregarBloqueData.diaIndex].bloques.length + 1}`,
        ejercicios: [ejercicio]
      };
      newDias[overAgregarBloqueData.diaIndex].bloques.push(nuevoBloque);
      
      setFormData({ ...formData, dias: newDias });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  // Componente para botón "Agregar Bloque" droppable
  function DroppableAgregarBloque({ diaIndex, onAgregarBloque }: { diaIndex: number; onAgregarBloque: () => void }) {
    const agregarBloqueId = `agregar-bloque-${diaIndex}`;
    const { setNodeRef, isOver } = useDroppable({
      id: agregarBloqueId,
    });

    return (
                  <button
        ref={setNodeRef}
                    type="button"
        onClick={onAgregarBloque}
        className={`ml-4 text-sm py-2 px-3 border border-dashed rounded-md transition-colors ${
          isOver 
            ? 'bg-blue-500 text-white border-blue-600' 
            : 'text-blue-600 hover:text-blue-700 border-blue-300'
        }`}
      >
        {isOver ? 'Soltar aquí para crear bloque' : '+ Agregar Bloque'}
                  </button>
    );
  }

  // Componente para bloque droppable
  function DroppableBloque({
    diaIndex,
    bloqueIndex,
    bloque,
    ejerciciosProfesor,
    ejerciciosSeleccionados,
    ejerciciosEditando,
    onBloqueChange,
    onEliminarBloque,
    onToggleSeleccionarTodos,
    onEliminarEjerciciosSeleccionados,
    onToggleSeleccionEjercicio,
    onEjercicioChange,
    onEjercicioSeleccionar,
    onAbrirCrearEjercicio,
    onToggleEditarEjercicio,
    isEjercicioEditando,
    onAgregarEjercicio,
    onEliminarEjercicio,
    onMoverEjercicio,
  }: {
    diaIndex: number;
    bloqueIndex: number;
    bloque: Bloque;
    ejerciciosProfesor: EjercicioProfesor[] | undefined;
    ejerciciosSeleccionados: Set<string>;
    ejerciciosEditando: Set<string>;
    onBloqueChange: (field: keyof Bloque, value: string) => void;
    onEliminarBloque: () => void;
    onToggleSeleccionarTodos: () => void;
    onEliminarEjerciciosSeleccionados: () => void;
    onToggleSeleccionEjercicio: (ejercicioIndex: number) => void;
    onEjercicioChange: (ejercicioIndex: number, field: 'series' | 'repeticiones' | 'peso' | 'pausa', value: number | string) => void;
    onEjercicioSeleccionar: (ejercicioIndex: number, ejercicioId: string) => void;
    onAbrirCrearEjercicio: (ejercicioIndex: number) => void;
    onToggleEditarEjercicio: (ejercicioIndex: number) => void;
    isEjercicioEditando: (ejercicioIndex: number) => boolean;
    onAgregarEjercicio: () => void;
    onEliminarEjercicio: (ejercicioIndex: number) => void;
    onMoverEjercicio: (ejercicioIndex: number, direccion: 'arriba' | 'abajo') => void;
  }) {
    const bloqueId = `bloque-${diaIndex}-${bloqueIndex}`;
    const ejercicioIds = bloque.ejercicios.map((_, idx) => `ejercicio-${diaIndex}-${bloqueIndex}-${idx}`);
    const { setNodeRef, isOver } = useDroppable({
      id: bloqueId,
    });

    return (
      <div 
        ref={setNodeRef}
        className={`ml-4 border-l-2 border-blue-200 pl-4 ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 rounded' : ''}`}
      >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Bloque</label>
                          <input
                            type="text"
                            value={bloque.nombre}
              onChange={(e) => onBloqueChange('nombre', e.target.value)}
                            required
                            placeholder="Ej: Bloque 1: Pecho"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
            onClick={onEliminarBloque}
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                        >
                          Eliminar Bloque
                        </button>
                      </div>

        <SortableContext items={ejercicioIds} strategy={verticalListSortingStrategy}>
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
                    onChange={onToggleSeleccionarTodos}
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
                    onClick={onEliminarEjerciciosSeleccionados}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                Eliminar seleccionados
                              </button>
                            )}
                          </div>
                        )}
                        {bloque.ejercicios.map((ejercicio, ejercicioIndex) => {
              const estaEditando = isEjercicioEditando(ejercicioIndex);
                          const ejercicioActual = ejerciciosProfesor?.find(ej => 
                            ej.nombre === ejercicio.nombre && ej.videoUrl === ejercicio.videoUrl
                          );
                          const ejercicioIdSeleccionado = ejercicioActual ? (ejercicioActual._id || ejercicioActual.id) : '';
                          const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                          const estaSeleccionado = ejerciciosSeleccionados.has(key);
              const ejercicioId = `ejercicio-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
              const {
                attributes,
                listeners,
                setNodeRef,
                transform,
                transition,
                isDragging,
              } = useSortable({ id: ejercicioId });

              const style = {
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
              };

              // Prevenir que eventos de input propaguen y activen drag
              const handleInputEvent = (e: React.MouseEvent | React.FocusEvent | React.KeyboardEvent) => {
                e.stopPropagation();
              };

                          return (
                <div 
                  key={ejercicioIndex} 
                  ref={setNodeRef}
                  style={style}
                  className={`bg-gray-50 rounded-lg p-4 border-2 transition-colors ${estaSeleccionado ? 'border-blue-500 bg-blue-100' : 'border-gray-200'} ${isDragging ? 'cursor-grabbing' : ''}`}
                >
                              <div className="flex items-start gap-2 mb-3">
                    <div
                      {...attributes}
                      {...listeners}
                      className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 select-none"
                      title="Arrastrar para mover"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      ⋮⋮
                    </div>
                                <input
                                  type="checkbox"
                                  checked={estaSeleccionado}
                      onChange={() => onToggleSeleccionEjercicio(ejercicioIndex)}
                      onMouseDown={handleInputEvent}
                      onFocus={handleInputEvent}
                                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </div>
                              <div className="space-y-3">
                                {/* Selector de ejercicio - siempre visible */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-700">
                                      Ejercicio
                                    </label>
                                    {(!ejercicio.nombre || ejercicioActual) && (
                                      <button
                                        type="button"
                            onClick={() => onAbrirCrearEjercicio(ejercicioIndex)}
                                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                                      >
                                        + Crear nuevo
                                      </button>
                                    )}
                                  </div>
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
                              onEjercicioSeleccionar(ejercicioIndex, value);
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
                                          value={ejercicio.series || ''}
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                            onEjercicioChange(ejercicioIndex, 'series', val);
                                          }}
                                          onMouseDown={handleInputEvent}
                                          onFocus={handleInputEvent}
                                          onClick={handleInputEvent}
                                          data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-series`}
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
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                            onEjercicioChange(ejercicioIndex, 'repeticiones', val);
                                          }}
                                          onMouseDown={handleInputEvent}
                                          onFocus={handleInputEvent}
                                          onClick={handleInputEvent}
                                          data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-repeticiones`}
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
                                          onChange={(e) => onEjercicioChange(ejercicioIndex, 'peso', e.target.value === '' ? null : parseFloat(e.target.value) || null)}
                                          onMouseDown={handleInputEvent}
                                          onFocus={handleInputEvent}
                                          onClick={handleInputEvent}
                                          data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-peso`}
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
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                            onEjercicioChange(ejercicioIndex, 'pausa', val);
                                          }}
                                          onMouseDown={handleInputEvent}
                                          onFocus={handleInputEvent}
                                          onClick={handleInputEvent}
                                          data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-pausa`}
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
                            onClick={() => onToggleEditarEjercicio(ejercicioIndex)}
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
                            onClick={() => onToggleEditarEjercicio(ejercicioIndex)}
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
                        onClick={() => onMoverEjercicio(ejercicioIndex, 'arriba')}
                                    disabled={ejercicioIndex === 0}
                                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1"
                                    title="Mover arriba"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                        onClick={() => onMoverEjercicio(ejercicioIndex, 'abajo')}
                                    disabled={ejercicioIndex === bloque.ejercicios.length - 1}
                                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1"
                                    title="Mover abajo"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                        onClick={() => onEliminarEjercicio(ejercicioIndex)}
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
              onClick={onAgregarEjercicio}
                          disabled={!ejerciciosProfesor || ejerciciosProfesor.length === 0}
                          className="w-full text-blue-600 hover:text-blue-700 text-sm py-2 border border-dashed border-blue-300 rounded-md disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                        >
                          + Agregar Ejercicio
                        </button>
                      </div>
        </SortableContext>
                    </div>
    );
  }

  // Componente para día droppable
  function DroppableDia({ 
    diaIndex, 
    dia, 
    formData, 
    ejerciciosProfesor, 
    ejerciciosSeleccionados, 
    ejerciciosEditando,
    onDiaChange,
    onEliminarDia,
    onBloqueChange,
    onEliminarBloque,
    onAgregarBloque,
    onToggleSeleccionarTodosBloque,
    onEliminarEjerciciosSeleccionados,
    onToggleSeleccionEjercicio,
    onEjercicioChange,
    onEjercicioSeleccionar,
    onAbrirCrearEjercicio,
    onToggleEditarEjercicio,
    isEjercicioEditando,
    onAgregarEjercicio,
    onEliminarEjercicio,
    onMoverEjercicio,
  }: {
    diaIndex: number;
    dia: DiaRutina;
    formData: Partial<Rutina>;
    ejerciciosProfesor: EjercicioProfesor[] | undefined;
    ejerciciosSeleccionados: Set<string>;
    ejerciciosEditando: Set<string>;
    onDiaChange: (field: keyof DiaRutina, value: string) => void;
    onEliminarDia: () => void;
    onBloqueChange: (bloqueIndex: number, field: keyof Bloque, value: string) => void;
    onEliminarBloque: (bloqueIndex: number) => void;
    onAgregarBloque: () => void;
    onToggleSeleccionarTodosBloque: (bloqueIndex: number) => void;
    onEliminarEjerciciosSeleccionados: (bloqueIndex: number) => void;
    onToggleSeleccionEjercicio: (bloqueIndex: number, ejercicioIndex: number) => void;
    onEjercicioChange: (bloqueIndex: number, ejercicioIndex: number, field: 'series' | 'repeticiones' | 'peso' | 'pausa', value: number | string) => void;
    onEjercicioSeleccionar: (bloqueIndex: number, ejercicioIndex: number, ejercicioId: string) => void;
    onAbrirCrearEjercicio: (bloqueIndex: number, ejercicioIndex: number) => void;
    onToggleEditarEjercicio: (bloqueIndex: number, ejercicioIndex: number) => void;
    isEjercicioEditando: (bloqueIndex: number, ejercicioIndex: number) => boolean;
    onAgregarEjercicio: (bloqueIndex: number) => void;
    onEliminarEjercicio: (bloqueIndex: number, ejercicioIndex: number) => void;
    onMoverEjercicio: (bloqueIndex: number, ejercicioIndex: number, direccion: 'arriba' | 'abajo') => void;
  }) {
    const diaId = `dia-${diaIndex}`;
    const { setNodeRef, isOver } = useDroppable({
      id: diaId,
    });

    return (
      <div 
        ref={setNodeRef}
        className={`border border-gray-200 rounded-lg p-4 ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Día</label>
                    <input
                      type="text"
                      value={dia.nombre}
              onChange={(e) => onDiaChange('nombre', e.target.value)}
                      required
                      placeholder="Ej: Día 1: Pecho y Tríceps"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
            onClick={onEliminarDia}
                    className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                  >
                    Eliminar Día
                  </button>
                </div>

                <div className="space-y-4">
                  {dia.bloques.map((bloque, bloqueIndex) => (
            <DroppableBloque
              key={bloqueIndex}
              diaIndex={diaIndex}
              bloqueIndex={bloqueIndex}
              bloque={bloque}
              ejerciciosProfesor={ejerciciosProfesor}
              ejerciciosSeleccionados={ejerciciosSeleccionados}
              ejerciciosEditando={ejerciciosEditando}
              onBloqueChange={(field, value) => onBloqueChange(bloqueIndex, field, value)}
              onEliminarBloque={() => onEliminarBloque(bloqueIndex)}
              onToggleSeleccionarTodos={() => onToggleSeleccionarTodosBloque(bloqueIndex)}
              onEliminarEjerciciosSeleccionados={() => onEliminarEjerciciosSeleccionados(bloqueIndex)}
              onToggleSeleccionEjercicio={(ejercicioIndex) => onToggleSeleccionEjercicio(bloqueIndex, ejercicioIndex)}
              onEjercicioChange={(ejercicioIndex, field, value) => onEjercicioChange(bloqueIndex, ejercicioIndex, field, value)}
              onEjercicioSeleccionar={(ejercicioIndex, ejercicioId) => onEjercicioSeleccionar(bloqueIndex, ejercicioIndex, ejercicioId)}
              onAbrirCrearEjercicio={(ejercicioIndex) => onAbrirCrearEjercicio(bloqueIndex, ejercicioIndex)}
              onToggleEditarEjercicio={(ejercicioIndex) => onToggleEditarEjercicio(bloqueIndex, ejercicioIndex)}
              isEjercicioEditando={(ejercicioIndex) => isEjercicioEditando(bloqueIndex, ejercicioIndex)}
              onAgregarEjercicio={() => onAgregarEjercicio(bloqueIndex)}
              onEliminarEjercicio={(ejercicioIndex) => onEliminarEjercicio(bloqueIndex, ejercicioIndex)}
              onMoverEjercicio={(ejercicioIndex, direccion) => onMoverEjercicio(bloqueIndex, ejercicioIndex, direccion)}
            />
          ))}
          <DroppableAgregarBloque
            diaIndex={diaIndex}
            onAgregarBloque={onAgregarBloque}
          />
        </div>
      </div>
    );
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                <DroppableDia
                  key={diaIndex}
                  diaIndex={diaIndex}
                  dia={dia}
                  formData={formData}
                  ejerciciosProfesor={ejerciciosProfesor}
                  ejerciciosSeleccionados={ejerciciosSeleccionados}
                  ejerciciosEditando={ejerciciosEditando}
                  onDiaChange={(field, value) => handleDiaChange(diaIndex, field, value)}
                  onEliminarDia={() => eliminarDia(diaIndex)}
                  onBloqueChange={(bloqueIndex, field, value) => handleBloqueChange(diaIndex, bloqueIndex, field, value)}
                  onEliminarBloque={(bloqueIndex) => eliminarBloque(diaIndex, bloqueIndex)}
                  onAgregarBloque={() => agregarBloque(diaIndex)}
                  onToggleSeleccionarTodosBloque={(bloqueIndex) => toggleSeleccionarTodosBloque(diaIndex, bloqueIndex)}
                  onEliminarEjerciciosSeleccionados={(bloqueIndex) => eliminarEjerciciosSeleccionados(diaIndex, bloqueIndex)}
                  onToggleSeleccionEjercicio={(bloqueIndex, ejercicioIndex) => toggleSeleccionEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                  onEjercicioChange={(bloqueIndex, ejercicioIndex, field, value) => handleEjercicioChange(diaIndex, bloqueIndex, ejercicioIndex, field, value)}
                  onEjercicioSeleccionar={(bloqueIndex, ejercicioIndex, ejercicioId) => handleEjercicioSeleccionar(diaIndex, bloqueIndex, ejercicioIndex, ejercicioId)}
                  onAbrirCrearEjercicio={(bloqueIndex, ejercicioIndex) => abrirCrearEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                  onToggleEditarEjercicio={(bloqueIndex, ejercicioIndex) => toggleEditarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                  isEjercicioEditando={(bloqueIndex, ejercicioIndex) => isEjercicioEditando(diaIndex, bloqueIndex, ejercicioIndex)}
                  onAgregarEjercicio={(bloqueIndex) => agregarEjercicio(diaIndex, bloqueIndex)}
                  onEliminarEjercicio={(bloqueIndex, ejercicioIndex) => eliminarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                  onMoverEjercicio={(bloqueIndex, ejercicioIndex, direccion) => moverEjercicio(diaIndex, bloqueIndex, ejercicioIndex, direccion)}
                />
            ))}
          </div>
        </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white rounded-md p-3 border-2 border-blue-500 shadow-lg opacity-90">
                <p className="text-sm font-medium text-gray-900">Arrastrando ejercicio...</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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

      {/* Modal para crear ejercicio */}
      {showCrearEjercicio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Ejercicio</h2>
            {ejercicioError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4 text-sm">
                {ejercicioError}
              </div>
            )}
            <form onSubmit={handleCrearEjercicio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del ejercicio *
                </label>
                <input
                  type="text"
                  value={nuevoEjercicioNombre}
                  onChange={(e) => setNuevoEjercicioNombre(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Press de banca"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del video (opcional)
                </label>
                <input
                  type="url"
                  value={nuevoEjercicioVideoUrl}
                  onChange={(e) => setNuevoEjercicioVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={createEjercicioMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {createEjercicioMutation.isPending ? 'Creando...' : 'Crear Ejercicio'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCrearEjercicio(false);
                    setNuevoEjercicioNombre('');
                    setNuevoEjercicioVideoUrl('');
                    setEjercicioError('');
                    setEjercicioContexto(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
