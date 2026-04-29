// src/controllers/mensajesController.js
import supabase from '../config/db.js';

const SII_BASE = 'https://sii.celaya.tecnm.mx/api';

// Obtiene el perfil del alumno desde el SII usando su token
const getPerfilSII = async (token) => {
  const res = await fetch(`${SII_BASE}/movil/estudiante`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo obtener el perfil del SII');
  const json = await res.json();
  return json.data; // { numero_control, persona, email, ... }
};

export const getHistorialMensajes = async (req, res) => {
  const { conversacion_id } = req.params;
  const token = req.headers['authorization'].split(' ')[1];

  try {
    const perfil = await getPerfilSII(token);
    const numero_control = perfil.numero_control;

    const { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('id', conversacion_id)
      .eq('numero_control', numero_control)
      .single();

    if (convError || !conv) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }

    const { data: mensajes, error: mensajesError } = await supabase
      .from('mensajes')
      .select('id, sender_type, content, created_at')
      .eq('conversation_id', conversacion_id)
      .order('created_at', { ascending: true });

    if (mensajesError) throw mensajesError;

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

export const enviarMensaje = async (req, res) => {
  const { conversacion_id } = req.params;
  const token = req.headers['authorization'].split(' ')[1];
  const { texto } = req.body;

  if (!texto || texto.trim() === '') {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  try {
    const perfil = await getPerfilSII(token);
    const numero_control = perfil.numero_control;

    const { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('id', conversacion_id)
      .eq('numero_control', numero_control)
      .single();

    if (convError || !conv) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }

    const { data: nuevo, error: insertError } = await supabase
      .from('mensajes')
      .insert({
        conversation_id: conversacion_id,
        sender_type: 'estudiante',
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

export const obtenerOCrearConversacion = async (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  const { maestro_id } = req.body;

  if (!maestro_id) {
    return res.status(400).json({ message: 'maestro_id es requerido' });
  }

  try {
    // 1. Obtener datos reales del alumno desde el SII
    const perfil = await getPerfilSII(token);
    const numero_control = perfil.numero_control;
    const nombre = perfil.persona;

    // 2. Upsert del estudiante en tu tabla
    const { error: upsertError } = await supabase
      .from('estudiantes')
      .upsert(
        { numero_control, nombre },
        { onConflict: 'numero_control' }
      );

    if (upsertError) throw upsertError;

    // 3. Validar que el maestro existe
    const { data: maestro, error: maestroError } = await supabase
      .from('maestros')
      .select('id')
      .eq('id', maestro_id)
      .single();

    if (maestroError || !maestro) {
      return res.status(404).json({ message: 'Maestro no encontrado' });
    }

    // 4. Buscar conversación existente
    const { data: existente } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('numero_control', numero_control)
      .eq('maestro_id', maestro_id)
      .single();

    if (existente) {
      return res.status(200).json({ conversacion_id: existente.id });
    }

    // 5. Crear nueva conversación
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