import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Interfaz extendida mejorada
export interface AuthRequest extends Request {
  auth?: {
    idOrganiser?: number;
    dni?: number;
    mail?: string;
    contact_email?: string;
    role?: string;
    type?: 'user' | 'company';
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      code: 'MISSING_TOKEN',
      message: 'Token no proporcionado. Acceso denegado.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      idOrganiser?: number;
      dni?: number;
      mail?: string;
      contact_email?: string;
      role?: string;
      type?: 'user' | 'company';
    };
    
    req.auth = decoded; // Asignamos todos los datos decodificados
    
    // Debug (puedes remover esto en producción)
    console.log('Usuario autenticado:', req.auth);
    
    next();
  } catch (error) {
    console.error('Error de token:', error);
    return res.status(403).json({ 
      code: 'INVALID_TOKEN',
      message: 'Token inválido o expirado.' 
    });
  }
};

// Middleware específico para empresas
export const isCompany = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth?.idOrganiser || req.auth?.type !== 'company') {
    return res.status(403).json({
      code: 'COMPANY_ACCESS_REQUIRED',
      message: 'Acceso restringido a empresas registradas'
    });
  }
  next();
};