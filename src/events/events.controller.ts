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
      res.status(403).json({ ok: false, message: 'No autorizado: el token no pertenece a un organizador válido.' });
      return;
    }

    if (!name || !description || !date || !idEventType || !idPlace || !sectors) {
      res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      return;
    }
    
    const parsedSectors = JSON.parse(sectors);
    if (!Array.isArray(parsedSectors) || parsedSectors.length === 0) {
      res.status(400).json({ ok: false, message: 'Debe especificar precios para los sectores.' });
      return;
    }

    if (name.length > 45) {
      res.status(400).json({ ok: false, message: 'El nombre no puede exceder 45 caracteres' });
      return;
    }

    if (description.length > 255) {
      res.status(400).json({ ok: false, message: 'La descripción no puede exceder 255 caracteres' });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ ok: false, message: 'Fecha inválida' });
      return;
    }

    const org = await prisma.organiser.findUnique({ where: { idOrganiser } });
    if (!org) {
      res.status(400).json({ ok: false, message: 'El organizador no existe' });
      return;
    }
    
    const etype = await prisma.eventType.findUnique({ where: { idType: Number(idEventType) } });
    if (!etype) {
      res.status(400).json({ ok: false, message: 'El tipo de evento no existe' });
      return;
    }
    const place = await prisma.place.findUnique({ where: { idPlace: Number(idPlace) } });
    if (!place) {
      res.status(400).json({ ok: false, message: 'El lugar no existe' });
      return;
    }
    let imagePath: string | null = null;
    if (req.file) {
      const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!valid.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ ok: false, message: 'Solo imágenes válidas' });
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
      res.status(500).json({ ok: false, message: 'No se pudieron generar asientos para el evento.' });
      return;
    }

    res.status(201).json({
      ok: true,
      message: 'Evento creado exitosamente',
      data: {
        ...result,
        imageUrl: result.image
          ? `${process.env.BACKEND_URL || "http://localhost:3000"}${result.image}`
          : "/ticket.png"
      },
      availableSeats,
    });
  } catch (error: any) {
    console.error('Error al crear evento:', error);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ ok: false, error: 'Error interno del servidor', details: error.message });
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

    const enriched = rows.map(ev => ({
      ...ev,
      imageUrl: ev.image
        ? `${process.env.BACKEND_URL || "http://localhost:3000"}${ev.image}`
        : "/ticket.png"
    }));

    res.status(200).json({ ok: true, data: enriched });
  } catch (error: any) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor', details: error.message });
  }
};

export const getEventTypes: RequestHandler = async (_req, res) => {
  try {
    const rows = await prisma.eventType.findMany();
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener tipos de eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};


export const getAllEventTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await prisma.eventType.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json({ ok: true, data: rows });
  } catch (error: any) {
    console.error('Error al obtener tipos de evento:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor', details: error.message });
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

    const enriched = events.map(ev => ({
      ...ev,
      imageUrl: ev.image
        ? `${process.env.BACKEND_URL || "http://localhost:3000"}${ev.image}`
        : "/ticket.png"
    }));

    res.status(200).json({ ok: true, data: enriched });
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

    const enriched = events.map(ev => ({
      ...ev,
      imageUrl: ev.image
        ? `${process.env.BACKEND_URL || "http://localhost:3000"}${ev.image}`
        : "/ticket.png"
    }));

    res.status(200).json({ ok: true, data: enriched });
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
      select: { idEvent: true, state: true, image: true, name: true },
    });

    res.status(200).json({
      ok: true,
      data: {
        ...updated,
        imageUrl: updated.image
          ? `${process.env.BACKEND_URL || "http://localhost:3000"}${updated.image}`
          : "/ticket.png"
      }
    });
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
      select: { idEvent: true, state: true, image: true, name: true },
    });

    res.status(200).json({
      ok: true,
      data: {
        ...updated,
        imageUrl: updated.image
          ? `${process.env.BACKEND_URL || "http://localhost:3000"}${updated.image}`
          : "/ticket.png"
      }
    });
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
        placeName: ev.place.name,
        availableSeats,
        minPrice,
        imageUrl: ev.image 
        ? `${process.env.BACKEND_URL || "http://localhost:3000"}${ev.image}` 
        : "/ticket.png",
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
        placeName: ev.place.name,
        availableSeats,
        imageUrl: ev.image 
        ? `${process.env.BACKEND_URL || "http://localhost:3000"}${ev.image}` 
        : "/ticket.png",
        minPrice,
        agotado: availableSeats === 0,
      };
    }));

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
      return res.status(404).json({ ok: false, message: 'Evento no encontrado' });
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
      res.status(400).json({ ok: false, message: 'Invalid id' });
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
      res.status(404).json({ ok: false, message: 'Event not found' });
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
      description: event.description,
      eventName: event.name,
      imageUrl: event.image
        ? `${process.env.BACKEND_URL || "http://localhost:3000"}${event.image}`
        : "/ticket.png",
      type: event.eventType.name,
      date: event.date,
      idPlace: event.idPlace,
      placeType,
      placeName: event.place.name,
      availableTickets: availableTotal,
      agotado,
    };

    if (placeType.toLowerCase() === 'nonenumerated') {
      payload.price = prices[0] ?? 0;
    } else {
      payload.minPrice = prices.length ? Math.min(...prices) : 0;
    }

    res.status(200).json({ ok: true, data: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
};

export const getEventSectors: RequestHandler = async (req, res) => {
  try {
    const idEvent = Number(req.params.id);
    if (Number.isNaN(idEvent)) {
      res.status(400).json({ ok: false, message: 'Invalid id' });
      return;
    }

    const ev = await prisma.event.findUnique({
      where: { idEvent },
      include: { place: true },
    });
    if (!ev) {
      res.status(404).json({ ok: false, message: 'Event not found' });
      return;
    }

    const idPlace = ev.idPlace;

    const sectorsWithPrice = await prisma.eventSector.findMany({
      where: { idEvent, idPlace },
      select: { idSector: true, price: true },
    });

    const response = await Promise.all(sectorsWithPrice.map(async (sector) => {
      const sectorMeta = await prisma.sector.findUnique({
        where: {
          idSector_idPlace: {
            idSector: sector.idSector,
            idPlace: idPlace
          }
        },
        select: { name: true, sectorType: true },
      });

      const availableCount = await prisma.seatEvent.count({
        where: {
          idEvent,
          idPlace,
          idSector: sector.idSector,
          state: 'available',
        },
      });

      return {
        idEvent,
        idSector: sector.idSector,
        name: sectorMeta?.name ?? `Sector ${sector.idSector}`,
        price: Number(sector.price),
        enumerated: sectorMeta?.sectorType.toLowerCase() === 'enumerated',
        availableTickets: availableCount,
      };
    }));

    res.status(200).json({ ok: true, data: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
};



export const getSeatsForEventSector: RequestHandler = async (req, res) => {
  try {
    const idEvent = Number(req.params.id);
    const idSector = Number(req.params.idSector);

    if (Number.isNaN(idEvent) || Number.isNaN(idSector)) {
      res.status(400).json({ ok: false, message: 'ID de evento o sector inválido' });
      return;
    }

    const seats = await prisma.seatEvent.findMany({
      where: {
        idEvent: idEvent,
        idSector: idSector,
      },
      select: {
        idSeat: true,
        state: true,
      },
      orderBy: {
        idSeat: 'asc',
      },
    });

    const responseData = seats.map(seat => ({
      id: seat.idSeat,
      state: seat.state,
      label: seat.idSeat.toString(),
    }));

    res.status(200).json({ ok: true, data: responseData });
  } catch (err) {
    console.error('Error al obtener asientos para el sector:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

export const searchEvents: RequestHandler = async (req, res, next) => {
  try {
    const rawQuery = String(req.query.query || '').trim();
    if (!rawQuery || rawQuery.length < 1) {
      return res.status(400).json({ ok: false, message: 'Consulta demasiado corta' });
    }

    const query = rawQuery; 
    const qLower = query.toLowerCase();

    const events = await prisma.event.findMany({
      where: {
        state: { in: ['Approved', 'Featured'] },
      },
      include: {
        eventType: true,
        place: true,
        eventSectors: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const matched = events.filter((ev) => {
      const name = String(ev.name || '');
      const typeName = String(ev.eventType?.name || '');

      const nameLower = name.toLowerCase();
      const typeLower = typeName.toLowerCase();

      return (
        nameLower.startsWith(qLower) ||
        nameLower.includes(' ' + qLower) ||
        typeLower === qLower
      );
    });

    const enrichedEvents = await Promise.all(
      matched.map(async (event) => {
        const seatCounts = await prisma.seatEvent.groupBy({
          by: ['state'],
          where: { idEvent: event.idEvent },
          _count: { idSeat: true },
        });

        const availableSeats =
          seatCounts.find((s) => s.state === 'available')?._count.idSeat || 0;

        const sectorPrices = event.eventSectors.map((s) =>
          parseFloat(s.price.toString())
        );
        const minPrice = sectorPrices.length > 0 ? Math.min(...sectorPrices) : 0;

        return {
          id: event.idEvent,
          name: event.name,
          description: event.description,
          date: event.date,
          location: event.place?.name ?? 'Lugar no especificado',
          imageUrl: event.image
            ? `${process.env.BACKEND_URL || 'http://localhost:3000'}${event.image}`
            : '/ticket.png',
          price: minPrice,
          type: event.eventType?.name ?? 'General',
          availableSeats,
          agotado: availableSeats === 0,
          featured: event.featured,
        };
      })
    );

    return res.status(200).json({ ok: true, data: enrichedEvents });
  } catch (err) {
    console.error('Error al buscar eventos:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

export const getTicketMap: RequestHandler = async (req, res) => {
  try {
    const idEvent = Number(req.params.id);
    if (Number.isNaN(idEvent)) {
      res.status(400).json({ ok: false, message: 'Invalid event id' });
      return;
    }

    // Obtener el evento para saber el idPlace
    const event = await prisma.event.findUnique({
      where: { idEvent },
      select: { idPlace: true }
    });

    if (!event) {
      res.status(404).json({ ok: false, message: 'Event not found' });
      return;
    }

    // Obtener los seatEvents disponibles para este evento
    const seatEvents = await prisma.seatEvent.findMany({
      where: { 
        idEvent,
        idPlace: event.idPlace,
        state: 'available'
      },
      select: {
        idSeat: true,
        idPlace: true,
        idSector: true,
      },
    });

    const ticketMap: Record<string, number> = {};
    seatEvents.forEach(seatEvent => {
      const key = `${seatEvent.idPlace}-${seatEvent.idSector}-${seatEvent.idSeat}`;
      ticketMap[key] = seatEvent.idSeat; // Usar idSeat como ticketId temporal
    });

    res.status(200).json({ ok: true, data: ticketMap });
  } catch (err) {
    console.error('Error al obtener mapa de tickets:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

