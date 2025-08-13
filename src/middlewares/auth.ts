import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Se extiende la interfaz para incluir el usuario decodificado del token
export interface AuthRequest extends Request {
  user?: {
    mail?: string;
    dni?: number;
    idOrganiser?: number;
    role?: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
  }

  try {
    // Se decodifica el token completo y se adjunta al objeto req.user
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as { mail?: string; idOrganiser?: number; role?: string; };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};
