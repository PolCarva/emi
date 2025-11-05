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

    res.json({
      alumno: {
        id: alumno._id,
        nombre: alumno.nombre,
        email: alumno.email,
        rutinaActual: alumno.rutinaActualId
      },
      historialSemanas: alumno.historialSemanas
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

module.exports = {
  getSeguimientoAlumno,
  getSeguimientoSemana
};

