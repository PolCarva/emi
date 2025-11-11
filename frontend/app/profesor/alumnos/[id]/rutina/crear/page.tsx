'use client';

import { useState } from 'react';
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
import type { Alumno } from '@/types';
import SearchableSelect from '@/components/common/SearchableSelect';

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
  volumen?: number;
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

  // Estado para selección múltiple de ejercicios (clave: `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`)
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<Set<string>>(new Set());
  
  // Estado para drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Sensores para drag and drop
  // Configurar delay para evitar activación accidental al escribir en inputs
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Requiere mover 10px antes de activar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
            seleccionarEjercicio(
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
      pausa: 60,
      volumen: 0
    });
    setDias(nuevosDias);
  };

  // Eliminar ejercicio de un bloque
  const eliminarEjercicio = (diaIndex: number, bloqueIndex: number, ejercicioIndex: number) => {
    const nuevosDias = [...dias];
    nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios = 
      nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios.filter((_, i) => i !== ejercicioIndex);
    setDias(nuevosDias);
    
    // Limpiar selección del ejercicio eliminado
    const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
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
    const bloque = dias[diaIndex]?.bloques[bloqueIndex];
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
    const bloque = dias[diaIndex]?.bloques[bloqueIndex];
    if (!bloque) return;

    const indicesAEliminar = bloque.ejercicios
      .map((_, ejercicioIndex) => {
        const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
        return ejerciciosSeleccionados.has(key) ? ejercicioIndex : null;
      })
      .filter((index): index is number => index !== null)
      .sort((a, b) => b - a); // Ordenar descendente para eliminar desde el final

    if (indicesAEliminar.length === 0) return;

    const nuevosDias = [...dias];
    indicesAEliminar.forEach(index => {
      nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios.splice(index, 1);
    });
    setDias(nuevosDias);

    // Limpiar selecciones eliminadas
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
    // Guardar el elemento activo y posición del scroll antes del cambio
    const activeElement = document.activeElement as HTMLInputElement | null;
    const shouldRestoreFocus = activeElement && activeElement.tagName === 'INPUT';
    const scrollY = window.scrollY;
    
    const nuevosDias = [...dias];
    const ejercicio = { ...nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex] };
    
    if (campo === 'peso') {
      ejercicio.peso = valor === '' ? null : (typeof valor === 'number' ? valor : parseFloat(String(valor)) || null);
      ejercicio.volumen = ejercicio.peso !== null && ejercicio.peso !== undefined
        ? ejercicio.series * ejercicio.repeticiones * ejercicio.peso
        : 0;
    } else if (campo === 'series') {
      ejercicio.series = typeof valor === 'number' ? valor : parseInt(String(valor));
      if (ejercicio.peso !== null) {
        ejercicio.volumen = ejercicio.series * ejercicio.repeticiones * (ejercicio.peso || 0);
      }
    } else if (campo === 'repeticiones') {
      ejercicio.repeticiones = typeof valor === 'number' ? valor : parseInt(String(valor));
      if (ejercicio.peso !== null) {
        ejercicio.volumen = ejercicio.series * ejercicio.repeticiones * (ejercicio.peso || 0);
      }
    } else if (campo === 'pausa') {
      ejercicio.pausa = typeof valor === 'number' ? valor : parseInt(String(valor));
    } else if (campo === 'nombre') {
      ejercicio.nombre = typeof valor === 'string' ? valor : String(valor);
    } else if (campo === 'videoUrl') {
      ejercicio.videoUrl = valor === null || valor === '' ? null : String(valor);
    } else if (campo === 'volumen') {
      ejercicio.volumen = typeof valor === 'number' ? valor : (valor === null ? 0 : parseFloat(String(valor)) || 0);
    }
    
    nuevosDias[diaIndex].bloques[bloqueIndex].ejercicios[ejercicioIndex] = ejercicio;
    setDias(nuevosDias);
    
    // Restaurar el focus y scroll después del re-render
    if (shouldRestoreFocus && activeElement) {
      requestAnimationFrame(() => {
        // Restaurar scroll primero
        window.scrollTo(0, scrollY);
        
        // Luego restaurar focus
        const input = document.querySelector(`input[data-ejercicio-id="${diaIndex}-${bloqueIndex}-${ejercicioIndex}-${campo}"]`) as HTMLInputElement;
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

  // Manejar inicio del drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Manejar final del drag (drop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

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

    // Si se suelta sobre otro ejercicio, mover dentro del mismo bloque o a otro bloque
    const overEjercicioData = parseEjercicioId(overId);
    if (overEjercicioData) {
      const nuevosDias = [...dias];
      
      // Si es el mismo bloque, solo reordenar
      if (activeData.diaIndex === overEjercicioData.diaIndex && 
          activeData.bloqueIndex === overEjercicioData.bloqueIndex) {
        const bloque = nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex];
        const ejercicios = arrayMove(
          bloque.ejercicios,
          activeData.ejercicioIndex,
          overEjercicioData.ejercicioIndex
        );
        nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios = ejercicios;
      } else {
        // Mover a otro bloque
        const ejercicio = nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
        nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
        nuevosDias[overEjercicioData.diaIndex].bloques[overEjercicioData.bloqueIndex].ejercicios.splice(overEjercicioData.ejercicioIndex, 0, ejercicio);
      }
      
      setDias(nuevosDias);
      return;
    }

    // Si se suelta sobre un bloque
    const overBloqueData = parseBloqueId(overId);
    if (overBloqueData) {
      const nuevosDias = [...dias];
      
      // Si es el mismo bloque, no hacer nada (ya se maneja arriba)
      if (activeData.diaIndex === overBloqueData.diaIndex && 
          activeData.bloqueIndex === overBloqueData.bloqueIndex) {
        return;
      }

      // Mover ejercicio a otro bloque
      const ejercicio = nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
      nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
      nuevosDias[overBloqueData.diaIndex].bloques[overBloqueData.bloqueIndex].ejercicios.push(ejercicio);
      
      setDias(nuevosDias);
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
      const nuevosDias = [...dias];
      
      // Crear nuevo bloque en el día destino
      const ejercicio = nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
      nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
      
      const nuevoBloque = {
        nombre: `Bloque ${nuevosDias[overDiaData.diaIndex].bloques.length + 1}`,
        ejercicios: [ejercicio]
      };
      nuevosDias[overDiaData.diaIndex].bloques.push(nuevoBloque);
      
      setDias(nuevosDias);
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
      const nuevosDias = [...dias];
      
      // Crear nuevo bloque con el ejercicio arrastrado
      const ejercicio = nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios[activeData.ejercicioIndex];
      nuevosDias[activeData.diaIndex].bloques[activeData.bloqueIndex].ejercicios.splice(activeData.ejercicioIndex, 1);
      
      const nuevoBloque = {
        nombre: `Bloque ${nuevosDias[overAgregarBloqueData.diaIndex].bloques.length + 1}`,
        ejercicios: [ejercicio]
      };
      nuevosDias[overAgregarBloqueData.diaIndex].bloques.push(nuevoBloque);
      
      setDias(nuevosDias);
    }
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
        className={`w-full px-4 py-2 text-sm rounded-md transition-colors ${
          isOver 
            ? 'bg-blue-500 text-white border-2 border-blue-600' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isOver ? 'Soltar aquí para crear bloque' : '+ Agregar Bloque'}
            </button>
    );
  }

  // Componente para bloque droppable
  interface DroppableBloqueProps {
    id: string;
    bloque: Bloque;
    bloqueIndex: number;
    diaIndex: number;
    ejercicioIds: string[];
    ejerciciosSeleccionados: Set<string>;
    ejercicios: EjercicioProfesor[] | undefined;
    onActualizarNombreBloque: (nombre: string) => void;
    onAgregarEjercicio: () => void;
    onEliminarBloque: () => void;
    onToggleSeleccionarTodos: () => void;
    onEliminarEjerciciosSeleccionados: () => void;
    onToggleSeleccionEjercicio: (ejercicioIndex: number) => void;
    onActualizarEjercicio: (ejercicioIndex: number, campo: keyof EjercicioRutina, valor: string | number | null) => void;
    onSeleccionarEjercicio: (ejercicioIndex: number, ejercicioId: string) => void;
    onAbrirCrearEjercicio: (ejercicioIndex: number) => void;
    onEliminarEjercicio: (ejercicioIndex: number) => void;
    puedeEliminarBloque: boolean;
  }

  function DroppableBloque({
    id,
    bloque,
    bloqueIndex,
    diaIndex,
    ejercicioIds,
    ejerciciosSeleccionados,
    ejercicios,
    onActualizarNombreBloque,
    onAgregarEjercicio,
    onEliminarBloque,
    onToggleSeleccionarTodos,
    onEliminarEjerciciosSeleccionados,
    onToggleSeleccionEjercicio,
    onActualizarEjercicio,
    onSeleccionarEjercicio,
    onAbrirCrearEjercicio,
    onEliminarEjercicio,
    puedeEliminarBloque,
  }: DroppableBloqueProps) {
    const { setNodeRef, isOver } = useDroppable({
      id,
    });

    return (
      <div
        ref={setNodeRef}
        className={`bg-gray-50 rounded-lg p-3 sm:p-4 ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                      <input
                        type="text"
                        value={bloque.nombre}
            onChange={(e) => onActualizarNombreBloque(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
                        className="font-medium text-gray-900 px-2 py-1 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                        placeholder="Nombre del bloque"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
              onClick={onAgregarEjercicio}
              onMouseDown={(e) => e.stopPropagation()}
                          className="flex-1 sm:flex-none px-3 py-1 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          + Ejercicio
                        </button>
            {puedeEliminarBloque && (
                          <button
                            type="button"
                onClick={onEliminarBloque}
                onMouseDown={(e) => e.stopPropagation()}
                            className="flex-1 sm:flex-none px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ejercicios */}
        <SortableContext items={ejercicioIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
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
                        const key = `${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
                        const estaSeleccionado = ejerciciosSeleccionados.has(key);
                        return (
                <SortableEjercicio
                  key={ejercicioIndex}
                  ejercicio={ejercicio}
                  ejercicioIndex={ejercicioIndex}
                  diaIndex={diaIndex}
                  bloqueIndex={bloqueIndex}
                  estaSeleccionado={estaSeleccionado}
                  ejercicios={ejercicios}
                  onToggleSeleccion={() => onToggleSeleccionEjercicio(ejercicioIndex)}
                  onActualizarEjercicio={(campo, valor) => onActualizarEjercicio(ejercicioIndex, campo, valor)}
                  onSeleccionarEjercicio={(ejercicioId) => onSeleccionarEjercicio(ejercicioIndex, ejercicioId)}
                  onAbrirCrearEjercicio={() => onAbrirCrearEjercicio(ejercicioIndex)}
                  onEliminarEjercicio={() => onEliminarEjercicio(ejercicioIndex)}
                />
              );
            })}
            {bloque.ejercicios.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No hay ejercicios en este bloque. Haz clic en &quot;+ Ejercicio&quot; para agregar uno o arrastra un ejercicio aquí.
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    );
  }

  // Componente para ejercicio arrastrable
  interface SortableEjercicioProps {
    ejercicio: EjercicioRutina;
    ejercicioIndex: number;
    diaIndex: number;
    bloqueIndex: number;
    estaSeleccionado: boolean;
    ejercicios: EjercicioProfesor[] | undefined;
    onToggleSeleccion: () => void;
    onActualizarEjercicio: (campo: keyof EjercicioRutina, valor: string | number | null) => void;
    onSeleccionarEjercicio: (ejercicioId: string) => void;
    onAbrirCrearEjercicio: () => void;
    onEliminarEjercicio: () => void;
  }

  function SortableEjercicio({
    ejercicio,
    ejercicioIndex,
    diaIndex,
    bloqueIndex,
    estaSeleccionado,
    ejercicios,
    onToggleSeleccion,
    onActualizarEjercicio,
    onSeleccionarEjercicio,
    onAbrirCrearEjercicio,
    onEliminarEjercicio,
  }: SortableEjercicioProps) {
    const id = `ejercicio-${diaIndex}-${bloqueIndex}-${ejercicioIndex}`;
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

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
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-md p-2 sm:p-3 border-2 transition-colors ${
          estaSeleccionado ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
      >
                          <div className="flex items-start gap-2 mb-2">
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
            onChange={onToggleSeleccion}
            onMouseDown={handleInputEvent}
            onFocus={handleInputEvent}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                            <div className="sm:col-span-2 lg:col-span-2">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-gray-700">
                                  Ejercicio *
                                </label>
                                <button
                                  type="button"
                onClick={onAbrirCrearEjercicio}
                onMouseDown={handleInputEvent}
                                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                                >
                                  + Crear nuevo
                                </button>
                              </div>
            <div onMouseDown={handleInputEvent} onFocus={handleInputEvent}>
                              <SearchableSelect
                                options={ejercicios?.map(ej => ({
                                  value: ej._id || ej.id || '',
                                  label: ej.nombre
                                })) || []}
                                value={ejercicios?.find(e => e.nombre === ejercicio.nombre && e.videoUrl === ejercicio.videoUrl)?._id || ejercicios?.find(e => e.nombre === ejercicio.nombre && e.videoUrl === ejercicio.videoUrl)?.id || ''}
                                onChange={(value) => {
                                  if (value) {
                    onSeleccionarEjercicio(value);
                                  }
                                }}
                                placeholder="Buscar ejercicio..."
                                required
                              />
            </div>
                            </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Series *
            </label>
            <input
              type="number"
              value={ejercicio.series || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                onActualizarEjercicio('series', val);
              }}
              onMouseDown={handleInputEvent}
              onFocus={handleInputEvent}
              onClick={handleInputEvent}
              data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-series`}
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
              value={ejercicio.repeticiones || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                onActualizarEjercicio('repeticiones', val);
              }}
              onMouseDown={handleInputEvent}
              onFocus={handleInputEvent}
              onClick={handleInputEvent}
              data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-repeticiones`}
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
              value={ejercicio.pausa || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                onActualizarEjercicio('pausa', val);
              }}
              onMouseDown={handleInputEvent}
              onFocus={handleInputEvent}
              onClick={handleInputEvent}
              data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-pausa`}
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
              onChange={(e) => onActualizarEjercicio('peso', e.target.value === '' ? null : parseFloat(e.target.value))}
              onMouseDown={handleInputEvent}
              onFocus={handleInputEvent}
              onClick={handleInputEvent}
              data-ejercicio-id={`${diaIndex}-${bloqueIndex}-${ejercicioIndex}-peso`}
                                min="0"
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <span className="ml-1">kg</span>
                            </div>
                            <button
                              type="button"
            onClick={onEliminarEjercicio}
            onMouseDown={handleInputEvent}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full sm:w-auto"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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

            {dias.map((dia, diaIndex) => {
              const diaId = `dia-${diaIndex}`;
              const { setNodeRef: setDiaNodeRef, isOver: isDiaOver } = useDroppable({
                id: diaId,
              });
              
              return (
              <div 
                key={diaIndex} 
                ref={setDiaNodeRef}
                className={`mb-4 sm:mb-6 border border-gray-200 rounded-lg p-3 sm:p-4 ${isDiaOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <input
                    type="text"
                    value={dia.nombre}
                    onChange={(e) => actualizarNombreDia(diaIndex, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="text-base sm:text-lg font-semibold text-gray-900 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    placeholder="Nombre del día"
                  />
                  {dias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarDia(diaIndex)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full sm:w-auto"
                    >
                      Eliminar Día
                    </button>
                  )}
            </div>

              {/* Bloques */}
              <div className="space-y-4">
                {dia.bloques.map((bloque, bloqueIndex) => {
                  const bloqueId = `bloque-${diaIndex}-${bloqueIndex}`;
                  const ejercicioIds = bloque.ejercicios.map((_, idx) => `ejercicio-${diaIndex}-${bloqueIndex}-${idx}`);
                  
                        return (
                    <DroppableBloque
                      key={bloqueIndex}
                      id={bloqueId}
                      bloque={bloque}
                      bloqueIndex={bloqueIndex}
                      diaIndex={diaIndex}
                      ejercicioIds={ejercicioIds}
                      ejerciciosSeleccionados={ejerciciosSeleccionados}
                      ejercicios={ejercicios}
                      onActualizarNombreBloque={(nombre) => actualizarNombreBloque(diaIndex, bloqueIndex, nombre)}
                      onAgregarEjercicio={() => agregarEjercicio(diaIndex, bloqueIndex)}
                      onEliminarBloque={() => eliminarBloque(diaIndex, bloqueIndex)}
                      onToggleSeleccionarTodos={() => toggleSeleccionarTodosBloque(diaIndex, bloqueIndex)}
                      onEliminarEjerciciosSeleccionados={() => eliminarEjerciciosSeleccionados(diaIndex, bloqueIndex)}
                      onToggleSeleccionEjercicio={(ejercicioIndex) => toggleSeleccionEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                      onActualizarEjercicio={(ejercicioIndex, campo, valor) => actualizarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, campo, valor)}
                      onSeleccionarEjercicio={(ejercicioIndex, ejercicioId) => seleccionarEjercicio(diaIndex, bloqueIndex, ejercicioIndex, ejercicioId)}
                      onAbrirCrearEjercicio={(ejercicioIndex) => abrirCrearEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                      onEliminarEjercicio={(ejercicioIndex) => eliminarEjercicio(diaIndex, bloqueIndex, ejercicioIndex)}
                      puedeEliminarBloque={dia.bloques.length > 1}
                    />
                      );
                      })}
                
                <DroppableAgregarBloque
                  diaIndex={diaIndex}
                  onAgregarBloque={() => agregarBloque(diaIndex)}
                />
        </div>
            </div>
            );
            })}
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
