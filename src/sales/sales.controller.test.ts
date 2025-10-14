import SalesController from './sales.controller';
import { prisma } from '../db/mysql';

// 🧠 Mockeamos Prisma
jest.mock('../db/mysql', () => ({
  prisma: {
    sale: { findMany: jest.fn() },
    ticket: { findMany: jest.fn() },
  },
}));

// 🧩 Mock Response de Express
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('SalesController.getUserTickets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('debería devolver 401 si no hay dniClient en el token', async () => {
    const req = { auth: {} } as any;
    const res = mockResponse();

    await SalesController.getUserTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No autorizado o DNI no encontrado en el token.',
    });
  });

  it('debería devolver [] si el usuario no tiene ventas', async () => {
    const req = { auth: { dni: '12345678' } } as any;
    const res = mockResponse();

    (prisma.sale.findMany as jest.Mock).mockResolvedValue([]);

    await SalesController.getUserTickets(req, res);

    expect(prisma.sale.findMany).toHaveBeenCalledWith({
      where: { dniClient: '12345678' },
      select: { idSale: true },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: [] });
  });

  it('debería devolver tickets formateados correctamente', async () => {
    const req = { auth: { dni: '12345678' } } as any;
    const res = mockResponse();

    (prisma.sale.findMany as jest.Mock).mockResolvedValue([{ idSale: 1 }]);

    (prisma.ticket.findMany as jest.Mock).mockResolvedValue([
      {
        idEvent: 10,
        idTicket: 1,
        idSeat: 5,
        idSale: 1,
        state: 'sold',
        event: {
          name: 'Bizarrap en River',
          date: new Date('2025-11-10T20:00:00Z'),
          place: { name: 'Estadio River' },
          image: '/img/biza.png',
        },
        eventSector: {
          sector: { name: 'Platea Baja', sectorType: 'enumerated' },
        },
      },
    ]);

    await SalesController.getUserTickets(req, res);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith({
      where: { idSale: { in: [1] }, state: 'sold' },
      include: {
        event: { include: { place: true } },
        eventSector: { include: { sector: true } },
      },
      orderBy: { event: { date: 'asc' } },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          eventId: 10,
          eventName: 'Bizarrap en River',
          location: 'Estadio River',
          sectorName: 'Platea Baja',
          seatNumber: 5,
          sectorType: 'enumerated',
          imageUrl: expect.stringMatching(/^http/),
        }),
      ]),
    });
  });

  it('debería manejar errores internos correctamente', async () => {
    const req = { auth: { dni: '12345678' } } as any;
    const res = mockResponse();

    (prisma.sale.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await SalesController.getUserTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Error interno del servidor',
        details: 'DB Error',
      })
    );
  });
});