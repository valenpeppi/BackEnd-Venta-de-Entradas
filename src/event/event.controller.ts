import { Response } from 'express';
import { prisma } from '../db/mysql';
import fs from 'fs';
import { AuthRequest } from '../auth/auth.middleware';
import { RequestHandler } from 'express';
import { createSeatEventGridForEvent } from '../seats/seats.controller'

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, date, idEventType, idPlace, sectors } = req.body;
    const state = 'Pending';
    const idOrganiser = req.auth?.idOrganiser;
    const featured = false;

    if (!idOrganiser) {
      res.status(403).json({ message: 'No autorizado: el token no pertenece a un organizador válido.' });
      return;
    }

    if (!name || !description || !date || !idEventType || !idPlace || !sectors) {
      res.status(400).json({ message: 'Faltan campos obligatorios' });
      return;
    }
    
    const parsedSectors = JSON.parse(sectors);
    if (!Array.isArray(parsedSectors) || parsedSectors.length === 0) {
      res.status(400).json({ message: 'Debe especificar precios para los sectores.' });
      return;
    }

    if (name.length > 45) {
      res.status(400).json({ message: 'El nombre no puede exceder 45 caracteres' });
      return;
    }

    if (description.length > 255) {
      res.status(400).json({ message: 'La descripción no puede exceder 255 caracteres' });
      return;
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
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

      for (const sector of parsedSectors) {
        await tx.eventSector.create({
          data: {
            idEvent: event.idEvent,
            idPlace: Number(idPlace),
            idSector: Number(sector.idSector),
            price: parseFloat(sector.price)
          }
        });
      }
      return event;
    });

    await createSeatEventGridForEvent(result.idEvent, Number(idPlace));

    const availableSeats = await prisma.seatEvent.count({
      where: { idEvent: result.idEvent, state: 'available' },
    });

    if (availableSeats <= 0) {
      res.status(500).json({ message: 'No se pudieron generar asientos para el evento.' });
      return;
    }

    res.status(201).json({
      message: 'Evento creado exitosamente',
      event: result,
      availableSeats,
    });
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
      where: { state: 'Pending' },
      select: {
        idEvent: true, name: true, description: true, date: true,
        image: true, idEventType: true, state: true, idOrganiser: true,
        featured: true,
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.status(200).json({ ok: true, data: events });
  } catch (err) {
    next(err);
  }
};

export const getAdminAllEvents: RequestHandler = async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      select: {
        idEvent: true, name: true, description: true, date: true,
        image: true, idEventType: true, state: true, idOrganiser: true,
        featured: true,
      },
      orderBy: {
        date: 'desc'
      }
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
      data: { state: "Approved" }, 
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
      where: { 
        featured: true,
        state: 'Approved'
      },
      include: {
        eventType: true,
        place: true,
        eventSectors: { include: { sector: true } },
      },
      orderBy: { date: 'asc' },
    });

    const enriched = await Promise.all(events.map(async (ev) => {
      const seatCounts = await prisma.seatEvent.groupBy({
        by: ['state'],
        where: { idEvent: ev.idEvent },
        _count: { idSeat: true },
      });

      const availableSeats = seatCounts.find(sc => sc.state === 'available')?._count.idSeat || 0;

      let minPrice = 0;
      if (ev.eventSectors.length > 0) {
        const prices = ev.eventSectors.map(es => Number(es.price));
        minPrice = prices.length ? Math.min(...prices) : 0;
      }

      return {
        ...ev,
        availableSeats,
        minPrice,
        agotado: availableSeats === 0,
      };
    }));

    res.status(200).json({ ok: true, data: enriched });

  } catch (err) {
    next(err);
  }
};


export const getApprovedEvents: RequestHandler = async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { state: 'Approved' },
      include: {
        eventType: true,
        place: true,
        eventSectors: { include: { sector: true } },
      },
      orderBy: { date: 'asc' },
    });

    const enriched = await Promise.all(events.map(async (ev) => {
      const seatCounts = await prisma.seatEvent.groupBy({
        by: ['state'],
        where: { idEvent: ev.idEvent },
        _count: { idSeat: true },
      });

      const availableSeats = seatCounts.find(sc => sc.state === 'available')?._count.idSeat || 0;

      let minPrice = 0;
      if (ev.eventSectors.length > 0) {
        const prices = ev.eventSectors.map(es => Number(es.price));
        minPrice = prices.length ? Math.min(...prices) : 0;
      }

      return {
        ...ev,
        availableSeats,
        minPrice,
        agotado: availableSeats === 0,
      };
    }));

    // 🔒 No devolver agotados
    const onlyWithStock = enriched.filter(ev => ev.availableSeats > 0);

    res.status(200).json({ ok: true, data: onlyWithStock });
  } catch (err) {
    next(err);
  }
};

export const toggleFeatureStatus: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    const currentEvent = await prisma.event.findUnique({
      where: { idEvent: id },
      select: { featured: true }
    });

    if (!currentEvent) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const updatedEvent = await prisma.event.update({
      where: { idEvent: id },
      data: { featured: !currentEvent.featured },
      select: { idEvent: true, featured: true }, 
    });

    res.status(200).json({ ok: true, data: updatedEvent });
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


  export const getEventSummary: RequestHandler = async (req, res) => {
  try {
    const idEvent = Number(req.params.id);
    if (Number.isNaN(idEvent)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { idEvent },
      include: {
        place: true,
        eventType: true,
        eventSectors: true
      }
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const placeType = event.place.placeType;
    const availableTotal = await prisma.seatEvent.count({
      where: { idEvent, state: 'available' },
    });
    const totalSeats = await prisma.seatEvent.count({
      where: { idEvent },
    });

    const agotado = totalSeats > 0 && availableTotal === 0;

    const eventSectors = await prisma.eventSector.findMany({
      where: { idEvent, idPlace: event.idPlace },
      select: { price: true },
    });

    const prices = eventSectors.map(es => Number(es.price));

    const payload: any = {
      id: event.idEvent,
      eventName: event.name,
      imageUrl: event.image ?? '',
      type: event.eventType.name,
      date: event.date,
      idPlace: event.idPlace,
      placeType,
      placeName: event.place.name, 
      availableTickets: availableTotal,
      agotado,
    };

    if (placeType === 'nonEnumerated') {
      payload.price = prices[0] ?? 0;
    } else {
      payload.minPrice = prices.length ? Math.min(...prices) : 0;
    }

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error' });
  }
};
export const getEventSectors: RequestHandler = async (req, res) => {
  try {
    const idEvent = Number(req.params.id);
    if (Number.isNaN(idEvent)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }

    const ev = await prisma.event.findUnique({
      where: { idEvent },
      include: { place: true },
    });
    if (!ev) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (ev.place.placeType.toLowerCase() !== 'hybrid') {
      res.json([]); 
      return;
    }


    const idPlace = ev.idPlace;

    const sectorsWithPrice = await prisma.eventSector.findMany({
      where: { idEvent, idPlace },
      select: { idSector: true, price: true },
    });

    const sectorIds = sectorsWithPrice.map(s => s.idSector);

    const sectorsMeta = await prisma.sector.findMany({
      where: { idPlace, idSector: { in: sectorIds } },
      select: { idSector: true, name: true },
    });
    const nameBySector = new Map(sectorsMeta.map(s => [s.idSector, s.name]));

    // 🔑 Traer todas las butacas con estado
    const seatEvents = await prisma.seatEvent.findMany({
      where: { idEvent, idPlace, idSector: { in: sectorIds } },
      select: { idSeat: true, idSector: true, state: true },
      orderBy: { idSeat: 'asc' },
    });

    const seatsBySector = new Map<number, { idSeat: number; state: string }[]>();
    for (const se of seatEvents) {
      if (!seatsBySector.has(se.idSector)) {
        seatsBySector.set(se.idSector, []);
      }
      seatsBySector.get(se.idSector)!.push(se);
    }

    const response = sectorsWithPrice.map(s => ({
      idEvent,
      idSector: s.idSector,
      name: nameBySector.get(s.idSector) ?? `Sector ${s.idSector}`,
      price: Number(s.price),
      seats: seatsBySector.get(s.idSector) ?? [],
      availableTickets: (seatsBySector.get(s.idSector) ?? []).filter(se => se.state === 'available').length,
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error' });
  }
};



