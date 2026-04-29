// src/controllers/mensajesController.js
import supabase from '../config/db.js';

/**
 * GET /api/movil/estudiante/mensajes/:conversacion_id
 * Historial de mensajes de una conversación del alumno autenticado.
 */
export const getHistorialMensajes = async (req, res) => {
  const { conversacion_id } = req.params;
  const numero_control = req.user.numero_control;

  try {
    // Verificar que la conversación pertenece al alumno
    const { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('id', conversacion_id)
      .eq('numero_control', numero_control)
      .single();

    if (convError || !conv) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }

    // Traer mensajes ordenados
    const { data: mensajes, error: mensajesError } = await supabase
      .from('mensajes')
      .select('id, sender_type, content, created_at')
      .eq('conversation_id', conversacion_id)
      .order('created_at', { ascending: true });

    if (mensajesError) throw mensajesError;

    // Formatear hora a 12h estilo Mexico
    const resultado = mensajes.map((m) => ({
      id: m.id,
      sender_type: m.sender_type,
      texto: m.content,
      hora: new Date(m.created_at).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Mexico_City',
      }),
    }));

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en getHistorialMensajes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/movil/estudiante/mensajes/:conversacion_id
 * Envía un mensaje del alumno en una conversación.
 * Body: { texto }
 */
export const enviarMensaje = async (req, res) => {
  const { conversacion_id } = req.params;
  const numero_control = req.user.numero_control;
  const { texto } = req.body;

  if (!texto || texto.trim() === '') {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  try {
    // Verificar que la conversación pertenece al alumno
    const { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('id', conversacion_id)
      .eq('numero_control', numero_control)
      .single();

    if (convError || !conv) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }

    // Insertar el mensaje
    const { data: nuevo, error: insertError } = await supabase
      .from('mensajes')
      .insert({
        conversation_id: conversacion_id,
        sender_type: 'Alumno',
        content: texto.trim(),
      })
      .select('id, sender_type, content, created_at')
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      id: nuevo.id,
      sender_type: nuevo.sender_type,
      texto: nuevo.content,
      hora: new Date(nuevo.created_at).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Mexico_City',
      }),
    });
  } catch (error) {
    console.error('Error en enviarMensaje:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/movil/estudiante/conversaciones
 * Obtiene o crea la conversación entre el alumno y un maestro.
 * Body: { maestro_id }
 */
export const obtenerOCrearConversacion = async (req, res) => {
  const numero_control = req.user.numero_control;
  const { maestro_id } = req.body;

  if (!maestro_id) {
    return res.status(400).json({ message: 'maestro_id es requerido' });
  }

  try {
    // Validar que el maestro existe
    const { data: maestro, error: maestroError } = await supabase
      .from('maestros')
      .select('id')
      .eq('id', maestro_id)
      .single();

    if (maestroError || !maestro) {
      return res.status(404).json({ message: 'Maestro no encontrado' });
    }

    // Buscar conversación existente
    const { data: existente } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('numero_control', numero_control)
      .eq('maestro_id', maestro_id)
      .single();

    if (existente) {
      return res.status(200).json({ conversacion_id: existente.id });
    }

    // Crear nueva conversación
    const { data: nueva, error: insertError } = await supabase
      .from('conversaciones')
      .insert({ numero_control, maestro_id })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({ conversacion_id: nueva.id });
  } catch (error) {
    console.error('Error en obtenerOCrearConversacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};