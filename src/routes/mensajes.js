// src/routes/mensajes.js
import { Router } from 'express';
import verifyToken from '../middlewares/auth.js';
import {
  getHistorialMensajes,
  enviarMensaje,
  obtenerOCrearConversacion,
} from '../controllers/mensajesController.js';

const router = Router();

// Todas las rutas requieren token JWT
router.use(verifyToken);

/**
 * POST /api/movil/estudiante/conversaciones
 * Crea o recupera la conversación del alumno con el maestro de su grupo
 * Body: { maestro_id }
 */
router.post('/conversaciones', obtenerOCrearConversacion);

/**
 * GET /api/movil/estudiante/mensajes/:conversacion_id
 * Trae el historial de mensajes de una conversación
 */
router.get('/mensajes/:conversacion_id', getHistorialMensajes);

/**
 * POST /api/movil/estudiante/mensajes/:conversacion_id
 * Envía un mensaje del alumno en una conversación
 * Body: { texto }
 */
router.post('/mensajes/:conversacion_id', enviarMensaje);

export default router;