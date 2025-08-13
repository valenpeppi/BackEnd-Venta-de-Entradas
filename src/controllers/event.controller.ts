import { Request, Response } from 'express';
import { db } from '../db/mysql';
import fs from 'fs';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, date, idEventType } = req.body;
    const state = 'Pendiente';

    const idOrganiser = (req as any).user?.companyId; // ❌ Evita esto en producción
    if (!idOrganiser) {
      res.status(403).json({ message: 'No autorizado: falta idOrganiser' });
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

    // Validar que el organizador exista
    const [org]: any = await db.query('SELECT idOrganiser FROM organiser_company WHERE idOrganiser = ?', [idOrganiser]);
    if (!Array.isArray(org) || org.length === 0) {
      res.status(400).json({ message: 'El organizador no existe' });
      return;
    }

    // Validar tipo de evento
    const [etype]: any = await db.query('SELECT idType FROM eventtype WHERE idType = ?', [idEventType]);
    if (!Array.isArray(etype) || etype.length === 0) {
      res.status(400).json({ message: 'El tipo de evento no existe' });
      return;
    }

    // Imagen
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

    // Insertar evento
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

export const getAllEvents = async (_req: Request, res: Response): Promise<void> => {
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
        u.surname AS organiserSurname,
        DATE_FORMAT(e.date, '%Y-%m-%d') AS dateOnly,
        DATE_FORMAT(e.date, '%H:%i:%s') AS timeOnly
      FROM event e
      JOIN eventtype et ON e.idEventType = et.idType
      JOIN users u ON e.dniOrganiser = u.dni
      ORDER BY e.date ASC
    `);
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getAllEventTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await db.query('SELECT idType, name FROM eventtype ORDER BY name ASC');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de evento:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};
