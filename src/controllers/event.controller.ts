import { Request, Response } from 'express';
import { db } from '../db/mysql';
import path from 'path';
import fs from 'fs';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, date, idEventType, dniOrganiser } = req.body;
    const state = 'active'; // Estado por defecto

    // Validación básica
    if (!name || !description || !date || !idEventType || !dniOrganiser) {
      res.status(400).json({ message: 'Faltan campos obligatorios' });
      return;
    }

    // Validar longitud de campos
    if (name.length > 45) {
      res.status(400).json({ message: 'El nombre no puede exceder los 45 caracteres' });
      return;
    }

    if (description.length > 60) {
      res.status(400).json({ message: 'La descripción no puede exceder los 60 caracteres' });
      return;
    }

    // Validar que el organizador existe
    const [organiser]: any = await db.query(
      'SELECT * FROM users WHERE dni = ?',
      [dniOrganiser]
    );

    if (organiser.length === 0) {
      res.status(400).json({ message: 'El organizador no existe' });
      return;
    }

    // Validar que el tipo de evento existe
    const [eventType]: any = await db.query(
      'SELECT * FROM eventTypes WHERE idEventType = ?',
      [idEventType]
    );

    if (eventType.length === 0) {
      res.status(400).json({ message: 'El tipo de evento no existe' });
      return;
    }

    // Manejo de la imagen
    let imagePath = null;
    if (req.file) {
      // Validar que sea una imagen
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path); // Eliminar el archivo subido
        res.status(400).json({ message: 'Solo se permiten imágenes (JPEG, JPG, PNG, GIF)' });
        return;
      }

      imagePath = `/uploads/${req.file.filename}`;
    }

    // Insertar en la base de datos
    const [result]: any = await db.query(
      `INSERT INTO events 
       (name, description, date, state, idEventType, dniOrganiser, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, date, state, idEventType, dniOrganiser, imagePath]
    );

    res.status(201).json({
      message: 'Evento creado exitosamente',
      eventId: result.insertId
    });
  } catch (error: any) {
    console.error('Error al crear el evento:', error);
    
    // Eliminar la imagen si hubo error después de subirla
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
};

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        e.idEvent,
        e.name,
        e.description,
        e.date,
        e.state,
        e.image,
        et.name AS eventType,
        u.name AS organiserName,
        u.lastName AS organiserLastName,
        DATE_FORMAT(e.date, '%Y-%m-%d') as dateOnly,
        DATE_FORMAT(e.date, '%H:%i:%s') as timeOnly
      FROM events e
      JOIN eventTypes et ON e.idEventType = et.idEventType
      JOIN users u ON e.dniOrganiser = u.dni
      ORDER BY e.date ASC
    `);
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener todos los eventos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
};

  export const getAllEventTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query('SELECT * FROM eventTypes');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de evento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
};










