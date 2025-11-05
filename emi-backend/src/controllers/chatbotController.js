const { validationResult } = require('express-validator');
const Alumno = require('../models/Alumno');
const Rutina = require('../models/Rutina');
const { getGeminiModel } = require('../config/gemini');

// Chat con IA
const chat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mensaje } = req.body;

    // Obtener datos del alumno
    const alumno = await Alumno.findById(req.userId).populate('rutinaActualId');

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Obtener últimas 5 semanas de progreso
    const ultimas5Semanas = alumno.historialSemanas
      .sort((a, b) => b.numeroSemana - a.numeroSemana)
      .slice(0, 5);

    // Construir contexto para el prompt
    let contexto = `Eres un asistente virtual de entrenamiento personal. Tu objetivo es ayudar al usuario con su rutina de ejercicios y progreso.

Información del alumno:
- Nombre: ${alumno.nombre}
`;

    if (alumno.rutinaActualId) {
      const rutina = alumno.rutinaActualId;
      contexto += `
Rutina actual:
- Nombre: ${rutina.nombre}
- Objetivo: ${rutina.objetivo}
- Nivel: ${rutina.nivel}
- Género: ${rutina.genero}
- Edad: ${rutina.edad}
- Periodización: ${rutina.periodizacion}

Días de entrenamiento:
${rutina.dias.map((dia, idx) => `
${idx + 1}. ${dia.nombre}
${dia.bloques.map((bloque, bidx) => `
   Bloque ${bidx + 1}: ${bloque.nombre}
   ${bloque.ejercicios.map(ej => `   - ${ej.nombre}: ${ej.series}x${ej.repeticiones} @ ${ej.peso}kg (pausa: ${ej.pausa}s)`).join('\n')}
`).join('\n')}
`).join('\n')}
`;
    }

    if (ultimas5Semanas.length > 0) {
      contexto += `
Progreso de las últimas ${ultimas5Semanas.length} semanas:
${ultimas5Semanas.map(semana => `
Semana ${semana.numeroSemana}:
${semana.dias.map(dia => `
  - Fecha: ${new Date(dia.fecha).toLocaleDateString()}
    Observaciones: ${dia.observaciones || 'Sin observaciones'}
    Ejercicios completados: ${dia.ejercicios.length}
    ${dia.ejercicios.slice(0, 3).map(ej => `    * Ejercicio: ${ej.pesoReal}kg x ${ej.repeticionesReal} reps (volumen: ${ej.volumenReal})`).join('\n')}
`).join('\n')}
`).join('\n')}
`;
    } else {
      contexto += `\nEl alumno aún no ha registrado progreso.`;
    }

    contexto += `\n\nPregunta del usuario: ${mensaje}

Responde de manera profesional, amigable y enfocada en el fitness. Proporciona consejos prácticos basados en la información disponible.`;

    // Llamar a Gemini API
    const model = getGeminiModel();
    const result = await model.generateContent(contexto);
    const response = await result.response;
    const respuesta = response.text();

    res.json({
      mensaje: respuesta
    });
  } catch (error) {
    console.error('Error en chatbot:', error);
    res.status(500).json({ error: 'Error al procesar el mensaje' });
  }
};

module.exports = {
  chat
};

