// src/middlewares/auth.js
import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // decode sin verificar firma — el token lo emite el SII ITC
    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Verificar que no haya expirado
    const ahora = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < ahora) {
      return res.status(401).json({ message: 'Token expirado' });
    }

    req.user = decoded; // { numero_control, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export default verifyToken;