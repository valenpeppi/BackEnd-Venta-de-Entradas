import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

export const getEventTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.eventtype.findMany();
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getPlaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.place.findMany();
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getSectorsByPlace = async (req: Request, res: Response): Promise<void> => {
  const { idPlace } = req.params;
  try {
    const rows = await prisma.sector.findMany({ where: { id_place: Number(idPlace) } });
    res.status(200).json(rows);
  } catch (error: any) {
    console.error(`Error al obtener sectores para el lugar ${idPlace}:`, error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};