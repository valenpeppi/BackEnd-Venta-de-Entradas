import { getPlaces, getSectorsByPlace } from './places.controller';
import { prisma } from '../db/mysql';

jest.mock('../db/mysql', () => ({
  prisma: {
    place: { findMany: jest.fn() },
    sector: { findMany: jest.fn() },
  },
}));

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('place.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlaces', () => {
    it('debería devolver una lista ordenada de lugares', async () => {
      const mockLugares = [
        { idPlace: 1, name: 'Estadio River' },
        { idPlace: 2, name: 'Luna Park' },
      ];
      (prisma.place.findMany as jest.Mock).mockResolvedValue(mockLugares);

      const res = mockResponse();

      await getPlaces({} as any, res, (() => {}) as any);

      expect(prisma.place.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLugares);
    });

    it('debería manejar errores y devolver 500', async () => {
      (prisma.place.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
      const res = mockResponse();

      await getPlaces({} as any, res, (() => {}) as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error interno del servidor',
          details: 'DB Error',
        })
      );
    });
  });

  describe('getSectorsByPlace', () => {
    it('debería devolver los sectores de un lugar dado', async () => {
      const req = { params: { idPlace: '1' } } as any;
      const res = mockResponse();
      const mockSectores = [
        { idSector: 1, name: 'Campo', idPlace: 1 },
        { idSector: 2, name: 'Platea', idPlace: 1 },
      ];

      (prisma.sector.findMany as jest.Mock).mockResolvedValue(mockSectores);

      await getSectorsByPlace(req, res);

      expect(prisma.sector.findMany).toHaveBeenCalledWith({ where: { idPlace: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSectores);
    });

    it('debería manejar errores en la búsqueda de sectores', async () => {
      const req = { params: { idPlace: '2' } } as any;
      const res = mockResponse();

      (prisma.sector.findMany as jest.Mock).mockRejectedValue(new Error('Sector Error'));

      await getSectorsByPlace(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error interno del servidor',
          details: 'Sector Error',
        })
      );
    });
  });
});
