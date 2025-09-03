import { Response } from 'express';
import { prisma } from '../db/mysql';
import fs from 'fs';
import { AuthRequest } from '../auth/auth.middleware';
import { RequestHandler } from 'express';




export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, date, idEventType, idPlace } = req.body;
    const state = 'Pending';
    const idOrganiser = req.auth?.idOrganiser;
    const featured = false

    if (!idOrganiser) {
      res.status(403).json({ message: 'No autorizado: el token no pertenece a un organizador válido.' });
      return;
    }

    if (!name || !description || !date || !idEventType || !idPlace) {
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
    const place = await prisma.place.findUnique({ where: { idPlace: Number(idPlace) } });
    if (!place) {
      res.status(400).json({ message: 'El lugar no existe' });
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
          idPlace: Number(idPlace), 
          featured,
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
      where: { state: 'Pending' },
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



export const approveEvent: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.event.update({
      where: { idEvent: id },
      data: { state: "Approved", featured: true }, 
      select: { idEvent: true, state: true, image: true, name: true}, 
    });
    res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const rejectEvent: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.event.update({
      where: { idEvent: id },
      data: { state: "Rejected" }, 
      select: { idEvent: true, state: true, image: true, name: true},
    });
    res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};




export const getFeaturedEvents: RequestHandler = async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { featured: true },
      include: {
        eventType: true,
        place: true,
        eventSectors: {
          include: {
            sector: {
              include: {
                seats: true, 
              },
            },
            prices: true,
          },
        },
      },
    });

    const enriched = events.map(ev => {
      let availableSeats = 0;

      ev.eventSectors.forEach(es => {
        es.sector.seats.forEach(seat => {
          if (seat.state.toLowerCase() === 'libre') {
            availableSeats++;
          }
        });
      });

      return { ...ev, availableSeats };
    });

    res.status(200).json({ ok: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

export const getAvailableDatesByPlace: RequestHandler = async (req, res, next) => {
    const { idPlace } = req.params;
    try {
      const events = await prisma.event.findMany({
        where: {
          idPlace: Number(idPlace),
          state: {
            in: ['Approved', 'Pending'],
          },
        },
        select: {
          date: true,
        },
      });
      const occupiedDates = events.map(event => event.date.toISOString().split('T')[0]);
      res.status(200).json({ ok: true, data: occupiedDates });
    } catch (err) {
      next(err);
    }
  };
