const Rutina = require('../models/Rutina');
const Alumno = require('../models/Alumno');

// Obtener rutina actual del alumno
const getRutinaActual = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.userId);

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'No tienes una rutina asignada' });
    }

    const rutina = await Rutina.findById(alumno.rutinaActualId);

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    res.json(rutina);
  } catch (error) {
    console.error('Error al obtener rutina:', error);
    res.status(500).json({ error: 'Error al obtener rutina' });
  }
};

// Obtener rutina para una semana específica
const getRutinaSemana = async (req, res) => {
  try {
    const { num } = req.params;
    const numeroSemana = parseInt(num);

    const alumno = await Alumno.findById(req.userId);

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'No tienes una rutina asignada' });
    }

    const rutina = await Rutina.findById(alumno.rutinaActualId);

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Devolver la rutina con la semana actualizada (para visualización)
    res.json({
      ...rutina.toObject(),
      semanaActual: numeroSemana
    });
  } catch (error) {
    console.error('Error al obtener rutina de semana:', error);
    res.status(500).json({ error: 'Error al obtener rutina de semana' });
  }
};

// Actualizar peso de un ejercicio en la rutina para una semana/día específica
const updateEjercicioPeso = async (req, res) => {
  try {
    const { diaIndex, bloqueIndex, ejercicioIndex } = req.params;
    const { peso, numeroSemana } = req.body;

    // Validar que peso sea un número válido
    if (peso !== null && peso !== undefined && (isNaN(peso) || peso < 0)) {
      return res.status(400).json({ error: 'El peso debe ser un número positivo o null' });
    }

    if (!numeroSemana || isNaN(numeroSemana)) {
      return res.status(400).json({ error: 'El número de semana es requerido' });
    }

    const alumno = await Alumno.findById(req.userId);

    if (!alumno.rutinaActualId) {
      return res.status(404).json({ error: 'No tienes una rutina asignada' });
    }

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
    console.error('Error al actualizar peso del ejercicio:', error);
    res.status(500).json({ error: 'Error al actualizar peso del ejercicio' });
  }
};

// Obtener pesos de una semana específica
const getPesosSemana = async (req, res) => {
  try {
    const { numeroSemana } = req.params;
    const semanaNum = parseInt(numeroSemana);

    const alumno = await Alumno.findById(req.userId);

    if (!alumno.pesosPorSemana) {
      return res.json({});
    }

    // Filtrar pesos de la semana específica
    // Mongoose puede devolver el Map como objeto o como Map
    const pesosSemana = {};
    const pesos = alumno.pesosPorSemana;
    
    // Si es un Map, usar forEach; si es un objeto, usar Object.entries
    if (pesos instanceof Map) {
      pesos.forEach((peso, clave) => {
        const partes = clave.split('-');
        if (partes[0] === semanaNum.toString()) {
          pesosSemana[clave] = peso;
        }
      });
    } else {
      // Si viene como objeto desde la BD
      Object.entries(pesos).forEach(([clave, peso]) => {
        const partes = clave.split('-');
        if (partes[0] === semanaNum.toString()) {
          pesosSemana[clave] = peso;
        }
      });
    }

    res.json(pesosSemana);
  } catch (error) {
    console.error('Error al obtener pesos de semana:', error);
    res.status(500).json({ error: 'Error al obtener pesos de semana' });
  }
};

module.exports = {
  getRutinaActual,
  getRutinaSemana,
  updateEjercicioPeso,
  getPesosSemana
};

