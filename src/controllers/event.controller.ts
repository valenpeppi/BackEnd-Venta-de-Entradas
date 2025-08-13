import { Response } from 'express';
import { db } from '../db/mysql';
import fs from 'fs';
import { AuthRequest } from '../middlewares/auth'; 

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, date, idEventType } = req.body;
    const state = 'Pendiente';
    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file); 

    // Se obtiene el idOrganiser del usuario autenticado a través del token
    const idOrganiser = req.auth?.idOrganiser;

    if (!idOrganiser) {
      res.status(403).json({ message: 'No autorizado: el token no pertenece a un organizador válido.' });
      return;
    }

    if (!name || !description || !date || !idEventType) {
      res.status(400).json({ message: 'Faltan campos obligatorios' });
      return;
    }

    if (name.length > 45) {
      res.status(400).json({ message: 'El nombre no puede exceder 45 caracteres' });
      return;
    }

    if (description.length > 60) {
      res.status(400).json({ message: 'La descripción no puede exceder 60 caracteres' });
      return;
    }

    const [org]: any = await db.query('SELECT idOrganiser FROM organiser_company WHERE idOrganiser = ?', [idOrganiser]);
    if (!Array.isArray(org) || org.length === 0) {
      res.status(400).json({ message: 'El organizador no existe' });
      return;
    }

    const [etype]: any = await db.query('SELECT idType FROM eventtype WHERE idType = ?', [idEventType]);
    if (!Array.isArray(etype) || etype.length === 0) {
      res.status(400).json({ message: 'El tipo de evento no existe' });
      return;
    }

    let imagePath: string | null = null;
    if (req.file) {
      const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!valid.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ message: 'Solo imágenes válidas' });
        return;
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    const [result]: any = await db.query(
      `INSERT INTO event (name, description, date, state, idEventType, idOrganiser, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, date, state, idEventType, idOrganiser, imagePath]
    );

    res.status(201).json({ message: 'Evento creado exitosamente', eventId: result.insertId });
  } catch (error: any) {
    console.error('Error al crear evento:', error);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getAllEvents = async (_req: AuthRequest, res: Response): Promise<void> => {
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
        oc.company_name AS organiserName,
        DATE_FORMAT(e.date, '%Y-%m-%d') AS dateOnly,
        DATE_FORMAT(e.date, '%H:%i:%s') AS timeOnly
      FROM event e
      JOIN eventtype et ON e.idEventType = et.idType
      JOIN organiser_company oc ON e.idOrganiser = oc.idOrganiser
      ORDER BY e.date ASC
    `);
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getAllEventTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows]: any = await db.query('SELECT idType, name FROM eventtype ORDER BY name ASC');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de evento:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};
