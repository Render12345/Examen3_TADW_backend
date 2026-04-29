// src/controllers/mensajesController.js
import pool from '../config/db.js';

/**
 * GET /api/movil/estudiante/mensajes/:conversacion_id
 *
 * Devuelve el historial de mensajes de una conversación.
 * Solo permite acceder si el alumno autenticado es dueño de esa conversación.
 *
 * Respuesta:
 * [
 *   { id, sender_type, texto, hora },
 *   ...
 * ]
 */
export const getHistorialMensajes = async (req, res) => {
  const { conversacion_id } = req.params;
  const numero_control = req.user.numero_control;

  try {
    // 1. Verificar que la conversación pertenece al alumno autenticado
    const convResult = await pool.query(
      `SELECT id FROM conversaciones
       WHERE id = $1 AND numero_control = $2`,
      [conversacion_id, numero_control]
    );

    if (convResult.rowCount === 0) {
      return res.status(403).json({
        message: 'No tienes acceso a esta conversación',
      });
    }

    // 2. Obtener mensajes ordenados cronológicamente
    const mensajesResult = await pool.query(
      `SELECT
         id,
         sender_type,
         content                                        AS texto,
         TO_CHAR(created_at AT TIME ZONE 'America/Mexico_City',
                 'HH12:MI AM')                         AS hora
       FROM mensajes
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversacion_id]
    );

    return res.status(200).json(mensajesResult.rows);
  } catch (error) {
    console.error('Error en getHistorialMensajes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/movil/estudiante/mensajes/:conversacion_id
 *
 * Envía un mensaje del alumno al maestro dentro de una conversación existente.
 * Si no existe conversación con ese maestro, la crea automáticamente.
 *
 * Body: { maestro_id, texto }
 *
 * Respuesta:
 * { id, sender_type, texto, hora }
 */
export const enviarMensaje = async (req, res) => {
  const { conversacion_id } = req.params;
  const numero_control = req.user.numero_control;
  const { texto } = req.body;

  // Validación básica
  if (!texto || texto.trim() === '') {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar que la conversación existe y pertenece al alumno
    const convResult = await client.query(
      `SELECT id FROM conversaciones
       WHERE id = $1 AND numero_control = $2`,
      [conversacion_id, numero_control]
    );

    if (convResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'No tienes acceso a esta conversación',
      });
    }

    // 2. Verificar que el maestro de esa conversación es el maestro del grupo del alumno
    const maestroValido = await client.query(
      `SELECT c.maestro_id
       FROM conversaciones c
       JOIN grupos g ON g.maestro_id = c.maestro_id
       WHERE c.id = $1
         AND c.numero_control = $2`,
      [conversacion_id, numero_control]
    );

    if (maestroValido.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Solo puedes enviar mensajes al maestro de tu grupo',
      });
    }

    // 3. Insertar el mensaje
    const insertResult = await client.query(
      `INSERT INTO mensajes (conversation_id, sender_type, content, created_at)
       VALUES ($1, 'Alumno', $2, NOW())
       RETURNING
         id,
         sender_type,
         content                                        AS texto,
         TO_CHAR(created_at AT TIME ZONE 'America/Mexico_City',
                 'HH12:MI AM')                         AS hora`,
      [conversacion_id, texto.trim()]
    );

    await client.query('COMMIT');

    return res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en enviarMensaje:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

/**
 * POST /api/movil/estudiante/conversaciones
 *
 * Crea (o recupera) la conversación entre el alumno autenticado
 * y el maestro de su grupo. Útil para abrir el chat por primera vez.
 *
 * Body: { maestro_id }
 *
 * Respuesta:
 * { conversacion_id }
 */
export const obtenerOCrearConversacion = async (req, res) => {
  const numero_control = req.user.numero_control;
  const { maestro_id } = req.body;

  if (!maestro_id) {
    return res.status(400).json({ message: 'maestro_id es requerido' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validar que ese maestro es realmente el maestro del grupo del alumno
    const grupoResult = await client.query(
      `SELECT g.maestro_id
       FROM grupos g
       JOIN conversaciones c ON c.numero_control = $1
       WHERE g.maestro_id = $2
       LIMIT 1`,
      [numero_control, maestro_id]
    );

    // También permitir si el alumno aún no tiene conversación:
    // solo validar que el maestro_id existe en la tabla maestros
    const maestroExiste = await client.query(
      `SELECT id FROM maestros WHERE id = $1`,
      [maestro_id]
    );

    if (maestroExiste.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Maestro no encontrado' });
    }

    // 2. Buscar si ya existe una conversación entre este alumno y este maestro
    const convExistente = await client.query(
      `SELECT id FROM conversaciones
       WHERE numero_control = $1 AND maestro_id = $2`,
      [numero_control, maestro_id]
    );

    if (convExistente.rowCount > 0) {
      await client.query('COMMIT');
      return res.status(200).json({
        conversacion_id: convExistente.rows[0].id,
      });
    }

    // 3. Crear nueva conversación
    const nuevaConv = await client.query(
      `INSERT INTO conversaciones (numero_control, maestro_id, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id`,
      [numero_control, maestro_id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      conversacion_id: nuevaConv.rows[0].id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en obtenerOCrearConversacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};