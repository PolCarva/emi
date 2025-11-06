const Alumno = require('../models/Alumno');

// Obtener todo el progreso de un alumno
const getSeguimientoAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;

    // Verificar que el alumno pertenece al profesor
    const alumno = await Alumno.findOne({
      _id: alumnoId,
      profesorId: req.userId
    }).populate('rutinaActualId');

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Usar toJSON para obtener el formato correcto con id en lugar de _id
    const alumnoJSON = alumno.toJSON();
    
    // Si rutinaActualId está populado, también necesita transformación
    let rutinaActual = null;
    if (alumno.rutinaActualId && typeof alumno.rutinaActualId === 'object') {
      rutinaActual = alumno.rutinaActualId.toJSON ? alumno.rutinaActualId.toJSON() : alumno.rutinaActualId;
    } else if (alumnoJSON.rutinaActualId) {
      rutinaActual = alumnoJSON.rutinaActualId;
    }

    // Obtener pesos guardados por semana
    const pesosPorSemana = alumnoJSON.pesosPorSemana || {};
    
    // Crear estructura de pesos organizada por semana/día/ejercicio
    const pesosOrganizados = {};
    Object.keys(pesosPorSemana).forEach(clave => {
      const [semana, dia, bloque, ejercicio] = clave.split('-');
      const semanaNum = parseInt(semana);
      const diaNum = parseInt(dia);
      const bloqueNum = parseInt(bloque);
      const ejercicioNum = parseInt(ejercicio);
      
      if (!pesosOrganizados[semanaNum]) {
        pesosOrganizados[semanaNum] = {};
      }
      if (!pesosOrganizados[semanaNum][diaNum]) {
        pesosOrganizados[semanaNum][diaNum] = {};
      }
      if (!pesosOrganizados[semanaNum][diaNum][bloqueNum]) {
        pesosOrganizados[semanaNum][diaNum][bloqueNum] = {};
      }
      
      pesosOrganizados[semanaNum][diaNum][bloqueNum][ejercicioNum] = pesosPorSemana[clave];
    });
    
    res.json({
      alumno: {
        id: alumnoJSON.id,
        nombre: alumnoJSON.nombre,
        email: alumnoJSON.email,
        rutinaActual: rutinaActual
      },
      historialSemanas: alumnoJSON.historialSemanas || [],
      pesosPorSemana: pesosOrganizados,
      rutinaActual: rutinaActual
    });
  } catch (error) {
    console.error('Error al obtener seguimiento:', error);
    res.status(500).json({ error: 'Error al obtener seguimiento' });
  }
};

// Obtener progreso de una semana específica
const getSeguimientoSemana = async (req, res) => {
  try {
    const { alumnoId, num } = req.params;
    const numeroSemana = parseInt(num);

    // Verificar que el alumno pertenece al profesor
    const alumno = await Alumno.findOne({
      _id: alumnoId,
      profesorId: req.userId
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const semana = alumno.historialSemanas.find(
      s => s.numeroSemana === numeroSemana
    );

    if (!semana) {
      return res.status(404).json({ error: 'Semana no encontrada' });
    }

    res.json(semana);
  } catch (error) {
    console.error('Error al obtener semana:', error);
    res.status(500).json({ error: 'Error al obtener semana' });
  }
};

// Actualizar peso de un ejercicio del alumno (profesor puede editar)
const updatePesoAlumno = async (req, res) => {
  try {
    const { alumnoId, diaIndex, bloqueIndex, ejercicioIndex } = req.params;
    const { peso, numeroSemana } = req.body;

    // Validar que peso sea un número válido
    if (peso !== null && peso !== undefined && (isNaN(peso) || peso < 0)) {
      return res.status(400).json({ error: 'El peso debe ser un número positivo o null' });
    }

    if (!numeroSemana || isNaN(numeroSemana)) {
      return res.status(400).json({ error: 'El número de semana es requerido' });
    }

    // Verificar que el alumno pertenece al profesor
    const alumno = await Alumno.findOne({
      _id: alumnoId,
      profesorId: req.userId
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'El alumno no tiene una rutina asignada' });
    }

    const Rutina = require('../models/Rutina');
    const rutina = await Rutina.findById(alumno.rutinaActualId);

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    const diaIdx = parseInt(diaIndex);
    const bloqueIdx = parseInt(bloqueIndex);
    const ejercicioIdx = parseInt(ejercicioIndex);
    const semanaNum = parseInt(numeroSemana);

    // Validar índices
    if (!rutina.dias[diaIdx]) {
      return res.status(400).json({ error: 'Día no encontrado' });
    }

    if (!rutina.dias[diaIdx].bloques[bloqueIdx]) {
      return res.status(400).json({ error: 'Bloque no encontrado' });
    }

    if (!rutina.dias[diaIdx].bloques[bloqueIdx].ejercicios[ejercicioIdx]) {
      return res.status(400).json({ error: 'Ejercicio no encontrado' });
    }

    // Crear clave única para semana/día/bloque/ejercicio
    const clave = `${semanaNum}-${diaIdx}-${bloqueIdx}-${ejercicioIdx}`;

    // Inicializar pesosPorSemana si no existe
    if (!alumno.pesosPorSemana) {
      alumno.pesosPorSemana = new Map();
    } else if (!(alumno.pesosPorSemana instanceof Map)) {
      // Si viene como objeto desde MongoDB, convertirlo a Map
      const pesosObj = alumno.pesosPorSemana;
      alumno.pesosPorSemana = new Map(Object.entries(pesosObj));
    }

    // Guardar o eliminar el peso
    if (peso === null || peso === undefined) {
      alumno.pesosPorSemana.delete(clave);
    } else {
      alumno.pesosPorSemana.set(clave, parseFloat(peso));
    }

    // Marcar como modificado para que Mongoose guarde el cambio del Map
    alumno.markModified('pesosPorSemana');
    
    await alumno.save();

    // Calcular volumen
    const ejercicio = rutina.dias[diaIdx].bloques[bloqueIdx].ejercicios[ejercicioIdx];
    const pesoFinal = peso === null || peso === undefined ? null : parseFloat(peso);
    const volumen = pesoFinal !== null && pesoFinal !== undefined
      ? ejercicio.series * ejercicio.repeticiones * pesoFinal
      : 0;

    res.json({
      message: 'Peso actualizado correctamente',
      ejercicio: {
        peso: pesoFinal,
        volumen: volumen
      }
    });
  } catch (error) {
    console.error('Error al actualizar peso del alumno:', error);
    res.status(500).json({ error: 'Error al actualizar peso del alumno' });
  }
};

module.exports = {
  getSeguimientoAlumno,
  getSeguimientoSemana,
  updatePesoAlumno
};

