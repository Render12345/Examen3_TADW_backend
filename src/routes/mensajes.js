// src/routes/mensajes.js
import { Router } from 'express';
import verifyToken from '../middlewares/auth.js';
import {
  getHistorialMensajes,
  enviarMensaje,
  obtenerOCrearConversacion,
} from '../controllers/mensajesController.js';
import { getMaestroDeGrupo } from '../controllers/gruposController.js';

const router = Router();

router.use(verifyToken);

// Obtener maestro_id de un grupo
router.get('/grupos/:id_grupo/maestro', getMaestroDeGrupo);

// Obtener o crear conversación
router.post('/conversaciones', obtenerOCrearConversacion);

// Historial de mensajes
router.get('/mensajes/:conversacion_id', getHistorialMensajes);

// Enviar mensaje
router.post('/mensajes/:conversacion_id', enviarMensaje);

export default router;