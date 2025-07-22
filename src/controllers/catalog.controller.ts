import { Request, Response } from 'express';
import { pool } from '../db/mysql'; // Importa el pool de conexiones

export const getEventTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM event_types');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getPlaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM places');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getSectorsByPlace = async (req: Request, res: Response): Promise<void> => {
  const { idPlace } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM sectors WHERE id_place = ?', [idPlace]);
    res.status(200).json(rows);
  } catch (error: any) {
    console.error(`Error al obtener sectores para el lugar ${idPlace}:`, error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};