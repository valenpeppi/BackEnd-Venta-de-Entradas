import { Response, Request } from 'express';
import { prisma } from '../db/mysql';
import fs from 'fs';
import { AuthRequest } from '../auth/auth.middleware';
import { RequestHandler } from 'express';

export const getPlaces: RequestHandler = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await prisma.place.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getSectorsByPlace = async (req: Request, res: Response): Promise<void> => {
  const { idPlace } = req.params;
  try {
    const rows = await prisma.sector.findMany({ where: { idPlace: Number(idPlace) } });
    res.status(200).json(rows);
  } catch (error: any) {
    console.error(`Error al obtener sectores para el lugar ${idPlace}:`, error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};