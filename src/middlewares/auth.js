// src/middlewares/auth.js
import jwt from 'jsonwebtoken';

/**
 * Verifica el token JWT del header Authorization.
 * Si es válido, inyecta req.user con el payload del token.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { numero_control, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export default verifyToken;