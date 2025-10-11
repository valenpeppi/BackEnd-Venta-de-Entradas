import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BOOT_ID } from '../system/boot';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

export interface AuthRequest extends Request {
  auth?: {
    idOrganiser?: number;
    dni?: number;
    mail?: string;
    contactEmail?: string;
    role?: string;
    type?: 'user' | 'company';
    bootId?: string; // agregado
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
      contactEmail?: string;
      role?: string;
      type?: 'user' | 'company';
      bootId?: string; // agregado
    };

    //  Verificación de reinicio: el token debe traer bootId y coincidir
    if (!decoded.bootId || decoded.bootId !== BOOT_ID) {
      return res.status(401).json({
        code: 'RESTART_INVALIDATED_TOKEN',
        message: 'Token inválido por reinicio del servidor.'
      });
    }

    req.auth = decoded;
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

export const isCompany = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth?.idOrganiser || req.auth?.type !== 'company') {
    return res.status(403).json({
      code: 'COMPANY_ACCESS_REQUIRED',
      message: 'Acceso restringido a empresas registradas'
    });
  }
  next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({
      code: 'ADMIN_ACCESS_REQUIRED',
      message: 'Acceso solo permitido para administradores'
    });
  }
  next();
};
