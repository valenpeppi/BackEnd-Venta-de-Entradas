import { Request, Response } from 'express';
import { pool } from '../db/mysql'; // Importa el pool de conexiones

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const eventData = req.body; // Los datos del evento vendrán en el cuerpo de la solicitud
  try {
    // Ejemplo de inserción de un evento en la tabla 'events'
    // Asegúrate de que los campos en eventData coincidan con las columnas de tu tabla
    const [result] = await pool.query('INSERT INTO events SET ?', [eventData]);
    res.status(201).json({
      message: 'Evento creado exitosamente',
      eventId: (result as any).insertId // 'insertId' está disponible en el objeto de resultado para inserciones
    });
  } catch (error: any) {
    console.error('Error al crear el evento:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ejemplo de obtención de todos los eventos desde la tabla 'events'
    const [rows] = await pool.query('SELECT * FROM events');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener todos los eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};