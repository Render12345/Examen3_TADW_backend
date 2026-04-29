// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mensajesRouter from './routes/mensajes.js';
import siiRouter from "./routes/sii.js";

dotenv.config();

const app = express();

// ──────────────────────────────────────────────
// Middlewares globales
// ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Rutas
// ──────────────────────────────────────────────

// Rutas de mensajes (prefijo que coincide con el frontend)
app.use("/api", siiRouter);
app.use('/api/movil/estudiante', mensajesRouter);

// ──────────────────────────────────────────────
// Inicio del servidor
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;