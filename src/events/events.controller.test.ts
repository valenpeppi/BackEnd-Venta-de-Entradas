 
import type { Response, Request } from 'express';
import {
  createEvent,
  getEventSummary,
  toggleFeatureStatus,
  searchEvents,
  getSeatsForEventSector,
  getTicketMap,
  getEventSectors,
} from './events.controller';

import type { AuthRequest } from '../auth/auth.middleware';

 
jest.mock('../db/mysql', () => ({
  prisma: {
    $transaction: jest.fn(),
    organiser: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn(), findMany: jest.fn() },
    place: { findUnique: jest.fn() },
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventSector: { create: jest.fn(), findMany: jest.fn() },
    sector: { findUnique: jest.fn() },
    seatEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));
jest.mock('../seats/seats.controller', () => ({
  createSeatEventGridForEvent: jest.fn(),
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  unlinkSync: jest.fn(),
}));

import { prisma } from '../db/mysql';
import { createSeatEventGridForEvent } from '../seats/seats.controller';
import fs from 'fs';

 
type UpFile = { mimetype: string; path: string; filename: string };

const mockRes = () => {
  const res: Partial<Response> = {};
   
  res.status = jest.fn().mockReturnValue(res);
   
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
};

const makeNext = () => jest.fn();
const resetAll = () => jest.clearAllMocks();

 
 
 
describe('createEvent', () => {
  beforeEach(resetAll);

  test('403 si el token no tiene organiser', async () => {
    const req = { body: {}, auth: {} } as unknown as AuthRequest;
    const res = mockRes();

    await createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  test('400 si faltan campos obligatorios', async () => {
    const req = { auth: { idOrganiser: 1 }, body: {} } as unknown as AuthRequest;
    const res = mockRes();

    await createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/Faltan campos/);
  });

  test('rechaza imagen con mimetype inválido y hace unlink', async () => {
    const req = {
      auth: { idOrganiser: 1 },
      body: {
        name: 'Show',
        description: 'Desc',
        date: '2025-10-10',
        idEventType: 1,
        idPlace: 2,
         
        sectors: JSON.stringify([{ idSector: 1, price: 1000 }]),
      },
      file: { mimetype: 'application/pdf', path: '/tmp/x', filename: 'x.pdf' },
    } as unknown as AuthRequest;
    const res = mockRes();

    (prisma.organiser.findUnique as jest.Mock).mockResolvedValue({ idOrganiser: 1 });
    (prisma.eventType.findUnique as jest.Mock).mockResolvedValue({ idType: 1 });
    (prisma.place.findUnique as jest.Mock).mockResolvedValue({ idPlace: 2 });

    await createEvent(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/x');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/Solo imágenes válidas/);
  });

  test('201 en happy path: crea evento, sectores, asientos y responde availableSeats', async () => {
    const req = {
      auth: { idOrganiser: 1 },
      body: {
        name: 'Recital',
        description: 'Grande',
        date: '2025-12-31',
        idEventType: 3,
        idPlace: 7,
        sectors: JSON.stringify([
          { idSector: 10, price: 5000 },
          { idSector: 11, price: 8000 },
        ]),
      },
      file: { mimetype: 'image/png', path: '/tmp/img', filename: 'img.png' } as UpFile,
    } as unknown as AuthRequest;
    const res = mockRes();

    (prisma.organiser.findUnique as jest.Mock).mockResolvedValue({ idOrganiser: 1 });
    (prisma.eventType.findUnique as jest.Mock).mockResolvedValue({ idType: 3 });
    (prisma.place.findUnique as jest.Mock).mockResolvedValue({ idPlace: 7 });

    const fakeEvent = {
      idEvent: 99,
      name: 'Recital',
      description: 'Grande',
      date: new Date('2025-12-31'),
      state: 'Pending',
      idEventType: 3,
      idOrganiser: 1,
      image: '/uploads/img.png',
      idPlace: 7,
      featured: false,
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const tx = {
        event: { create: jest.fn().mockResolvedValue(fakeEvent) },
        eventSector: { create: jest.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });

    (createSeatEventGridForEvent as jest.Mock).mockResolvedValue(undefined);
    (prisma.seatEvent.count as jest.Mock).mockResolvedValueOnce(120);

    await createEvent(req, res);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(createSeatEventGridForEvent).toHaveBeenCalledWith(99, 7);
    expect(prisma.seatEvent.count).toHaveBeenCalledWith({
      where: { idEvent: 99, state: 'available' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        ok: true,
        availableSeats: 120,
        data: expect.objectContaining({
          idEvent: 99,
          imageUrl: expect.stringContaining('/uploads/'),
        }),
      })
    );
  });
});

 
 
 
describe('getEventSummary', () => {
  beforeEach(resetAll);

  test('400 si id inválido', async () => {
    const req = { params: { id: 'NaN' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await getEventSummary(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('200 nonenumerated ⇒ devuelve price', async () => {
    const req = { params: { id: '5' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      idEvent: 5,
      name: 'Festival',
      description: 'desc',
      date: new Date('2025-01-01'),
      idPlace: 2,
      image: null,
      place: { name: 'Campo', placeType: 'nonEnumerated' },
      eventType: { name: 'Recital' },
      eventSectors: [],
    });

    (prisma.seatEvent.count as jest.Mock)
      .mockResolvedValueOnce(300)  
      .mockResolvedValueOnce(300);  

    (prisma.eventSector.findMany as jest.Mock).mockResolvedValue([{ price: 1234 }]);

    await getEventSummary(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0].data;
    expect(payload.placeType).toBe('nonEnumerated');
    expect(payload.price).toBe(1234);
    expect(payload.minPrice).toBeUndefined();
  });
});

 
 
 
describe('toggleFeatureStatus', () => {
  beforeEach(resetAll);

  test('404 si no existe', async () => {
    const req = { params: { id: '9' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);
    await toggleFeatureStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toMatch(/no encontrado/i);
  });

  test('200 y featured invertido', async () => {
    const req = { params: { id: '9' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findUnique as jest.Mock).mockResolvedValue({ featured: false });
    (prisma.event.update as jest.Mock).mockResolvedValue({ idEvent: 9, featured: true });

    await toggleFeatureStatus(req, res, next);

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { idEvent: 9 },
      data: { featured: true },
      select: { idEvent: true, featured: true },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.featured).toBe(true);
  });
});

 
 
 
describe('searchEvents', () => {
  beforeEach(resetAll);

  test('400 si query corta o vacía', async () => {
    const req = { query: { query: '' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await searchEvents(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('200 con eventos matcheados y minPrice/availableSeats', async () => {
    const req = { query: { query: 'biz' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findMany as jest.Mock).mockResolvedValue([
      {
        idEvent: 1,
        name: 'Bizarrap en Rosario',
        description: 'desc',
        date: new Date('2025-11-01'),
        place: { name: 'Arena' },
        image: null,
        eventType: { name: 'Recital' },
        eventSectors: [{ price: 10000 }, { price: 8000 }],
        featured: true,
        state: 'Approved',
      },
    ]);

    (prisma.seatEvent.groupBy as jest.Mock).mockImplementation(({ where: { idEvent } }: any) => {
      if (idEvent === 1) {
        return Promise.resolve([{ state: 'available', _count: { idSeat: 150 } }]);
      }
      return Promise.resolve([{ state: 'available', _count: { idSeat: 0 } }]);
    });

    await searchEvents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Bizarrap en Rosario',
        price: 8000,
        availableSeats: 150,
        featured: true,
      })
    );
  });
});

 
 
 
describe('getSeatsForEventSector', () => {
  beforeEach(resetAll);

  test('400 si ids inválidos', async () => {
    const req = { params: { id: 'x', idSector: 'y' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await getSeatsForEventSector(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('200 con asientos ordenados', async () => {
    const req = { params: { id: '1', idSector: '2' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.seatEvent.findMany as jest.Mock).mockResolvedValue([
      { idSeat: 1, state: 'available' },
      { idSeat: 2, state: 'sold' },
    ]);

    await getSeatsForEventSector(req, res, next);

    expect(prisma.seatEvent.findMany).toHaveBeenCalledWith({
      where: { idEvent: 1, idSector: 2 },
      select: { idSeat: true, state: true },
      orderBy: { idSeat: 'asc' },
    });

    const data = res.json.mock.calls[0][0].data;
    expect(data[0]).toEqual({ id: 1, state: 'available', label: '1' });
    expect(data[1]).toEqual({ id: 2, state: 'sold', label: '2' });
  });
});

 
 
 
describe('getTicketMap', () => {
  beforeEach(resetAll);

  test('400 con id inválido', async () => {
    const req = { params: { id: 'NaN' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    await getTicketMap(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('200 mapea asientos disponibles a {place-sector-seat: idSeat}', async () => {
    const req = { params: { id: '77' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findUnique as jest.Mock).mockResolvedValue({ idPlace: 5 });
    (prisma.seatEvent.findMany as jest.Mock).mockResolvedValue([
      { idSeat: 101, idPlace: 5, idSector: 2 },
      { idSeat: 102, idPlace: 5, idSector: 3 },
    ]);

    await getTicketMap(req, res, next);

    expect(prisma.seatEvent.findMany).toHaveBeenCalledWith({
      where: { idEvent: 77, idPlace: 5, state: 'available' },
      select: { idSeat: true, idPlace: true, idSector: true },
    });

    const map = res.json.mock.calls[0][0].data;
    expect(map['5-2-101']).toBe(101);
    expect(map['5-3-102']).toBe(102);
  });
});

 
 
 
describe('getEventSectors', () => {
  beforeEach(resetAll);

  test('404 si no existe el evento', async () => {
    const req = { params: { id: '3' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);
    await getEventSectors(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 lista sectores con enumerated y availableTickets', async () => {
    const req = { params: { id: '3' } } as unknown as Request;
    const res = mockRes();
    const next = makeNext();

    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      idPlace: 9,
      place: {},
    });
    (prisma.eventSector.findMany as jest.Mock).mockResolvedValue([
      { idSector: 1, price: 1000 },
      { idSector: 2, price: 2000 },
    ]);
    (prisma.sector.findUnique as jest.Mock).mockImplementation(({ where: { idSector_idPlace } }: any) => {
      const { idSector } = idSector_idPlace;
      return Promise.resolve(
        idSector === 1
          ? { name: 'Platea', sectorType: 'Enumerated' }
          : { name: 'Campo', sectorType: 'NonEnumerated' }
      );
    });
    (prisma.seatEvent.count as jest.Mock).mockImplementation(({ where: { idSector } }: any) => {
      return Promise.resolve(idSector === 1 ? 10 : 0);
    });

    await getEventSectors(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data).toEqual([
      {
        idEvent: 3,
        idSector: 1,
        name: 'Platea',
        price: 1000,
        enumerated: true,
        availableTickets: 10,
      },
      {
        idEvent: 3,
        idSector: 2,
        name: 'Campo',
        price: 2000,
        enumerated: false,
        availableTickets: 0,
      },
    ]);
  });
});
