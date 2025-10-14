import { createSeatEventGridForEvent, getSeatsForSector } from './seats.controller';
import { prisma } from '../db/mysql';

// 🧠 Mockeamos Prisma
jest.mock('../db/mysql', () => ({
  prisma: {
    sector: { findMany: jest.fn() },
    seatEvent: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// 🧩 Mock de Response
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('seats.controller', () => {
  beforeAll(() => {
    // Silenciar errores en consola
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  // ✅ TEST 1: createSeatEventGridForEvent
  describe('createSeatEventGridForEvent', () => {
    it('debería crear grilla de asientos para cada sector y asiento', async () => {
      (prisma.sector.findMany as jest.Mock).mockResolvedValue([
        {
          idSector: 1,
          seats: [{ idSeat: 101 }, { idSeat: 102 }],
        },
        {
          idSector: 2,
          seats: [{ idSeat: 201 }],
        },
      ]);

      await createSeatEventGridForEvent(10, 5);

      expect(prisma.sector.findMany).toHaveBeenCalledWith({
        where: { idPlace: 5 },
        include: { seats: true },
      });

      // Se deberían haber hecho 3 upserts (2 + 1)
      expect(prisma.seatEvent.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.seatEvent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            idEvent: 10,
            idPlace: 5,
            idSector: 1,
            idSeat: 101,
            state: 'available',
          }),
        })
      );
    });

    it('debería manejar error en findMany (lanzar excepción)', async () => {
      (prisma.sector.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(createSeatEventGridForEvent(10, 5)).rejects.toThrow('DB Error');
    });
  });

  // ✅ TEST 2: getSeatsForSector
  describe('getSeatsForSector', () => {
    it('debería devolver asientos formateados correctamente', async () => {
      const req = { params: { idEvent: '10', idSector: '1' } } as any;
      const res = mockResponse();

      (prisma.seatEvent.findMany as jest.Mock).mockResolvedValue([
        { idSeat: 1, state: 'available', seat: { label: 'A1' } },
        { idSeat: 2, state: 'reserved', seat: { label: 'A2' } },
      ]);

      await getSeatsForSector(req, res);

      expect(prisma.seatEvent.findMany).toHaveBeenCalledWith({
        where: { idEvent: 10, idSector: 1 },
        include: { seat: true },
        orderBy: { idSeat: 'asc' },
      });

      expect(res.json).toHaveBeenCalledWith({
        data: [
          { id: 1, label: 'A1', state: 'available' },
          { id: 2, label: 'A2', state: 'reserved' },
        ],
      });
    });

    it('debería manejar errores internos (500)', async () => {
      const req = { params: { idEvent: '10', idSector: '1' } } as any;
      const res = mockResponse();

      (prisma.seatEvent.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await getSeatsForSector(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener asientos',
      });
    });
  });
});