import { Response } from 'express';
import { prisma } from '../db/mysql';
import fs from 'fs';
import { AuthRequest } from '../auth/auth.middleware';
import { RequestHandler } from 'express';




export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, date, idEventType } = req.body;
    const state = 'Pendiente';
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

    // Validar fecha
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: 'Fecha inválida' });
      return;
    }

    const org = await prisma.organiser.findUnique({ where: { idOrganiser } });
    if (!org) {
      res.status(400).json({ message: 'El organizador no existe' });
      return;
    }
    
    const etype = await prisma.eventType.findUnique({ where: { idType: Number(idEventType) } });
    if (!etype) {
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
    
    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: parsedDate,
        state,
        idEventType: Number(idEventType),
        idOrganiser,
        image: imagePath,
      }
    });

    res.status(201).json({ message: 'Evento creado exitosamente', event });
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
    const rows = await prisma.event.findMany({
      include: {
        eventType: true, 
        organiser: true, 
      },
      orderBy: { date: 'asc' }
    });
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getAllEventTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await prisma.eventType.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de evento:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};



export const getPendingEvents: RequestHandler = async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      // si no usás status, cambialo por { approved: false }
      where: { state: 'PENDING' },
      select: {
        idEvent: true, name: true, description: true, date: true,
        image: true, idEventType: true, state: true, idOrganiser: true,
      },
    });
    res.status(200).json({ ok: true, data: events });
  } catch (err) {
    next(err);
  }
};