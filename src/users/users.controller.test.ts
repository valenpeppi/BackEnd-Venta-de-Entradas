import { getAllUsers, createUser } from './users.controller';
import { prisma } from '../db/mysql';

// 🧠 Mockeamos Prisma
jest.mock('../db/mysql', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
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

describe('users.controller', () => {
  beforeAll(() => {
    // Silenciar console.error para que no ensucie los tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  // ✅ getAllUsers
  describe('getAllUsers', () => {
    it('debería devolver todos los usuarios (200)', async () => {
      const mockUsers = [
        { dni: 1, name: 'Agustin', surname: 'Santinelli', mail: 'agus@gmail.com' },
        { dni: 2, name: 'Marto', surname: 'Lopez', mail: 'marto@gmail.com' },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const res = mockResponse();
      await getAllUsers({} as any, res);

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('debería manejar errores al obtener usuarios (500)', async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
      const res = mockResponse();

      await getAllUsers({} as any, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error interno del servidor',
          details: 'DB Error',
        })
      );
    });
  });

  // ✅ createUser
  describe('createUser', () => {
    it('debería crear usuario correctamente (201)', async () => {
      const req = {
        body: {
          dni: '12345678',
          name: 'Agustin',
          surname: 'Santinelli',
          mail: 'agus@gmail.com',
          birthDate: '2000-01-01',
          password: '1234',
        },
      } as any;

      const res = mockResponse();

      (prisma.user.create as jest.Mock).mockResolvedValue({ dni: 12345678 });

      await createUser(req, res);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dni: 12345678,
          name: 'Agustin',
          surname: 'Santinelli',
          mail: 'agus@gmail.com',
          password: '1234',
        }),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario creado exitosamente',
        userId: 12345678,
      });
    });

    it('debería devolver 400 si faltan campos obligatorios', async () => {
      const req = { body: { name: 'Agustin' } } as any;
      const res = mockResponse();

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan campos obligatorios para crear el usuario.',
      });
    });

    it('debería devolver 409 si el usuario ya existe (error P2002)', async () => {
      const req = {
        body: {
          dni: '12345678',
          name: 'Agustin',
          surname: 'Santinelli',
          mail: 'agus@gmail.com',
          birthDate: '2000-01-01',
          password: '1234',
        },
      } as any;
      const res = mockResponse();

      const errorP2002 = new Error('Unique constraint failed');
      (errorP2002 as any).code = 'P2002';
      (prisma.user.create as jest.Mock).mockRejectedValue(errorP2002);

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El usuario ya existe (DNI o email duplicado).',
      });
    });

    it('debería manejar errores internos (500)', async () => {
      const req = {
        body: {
          dni: '12345678',
          name: 'Agustin',
          surname: 'Santinelli',
          mail: 'agus@gmail.com',
          birthDate: '2000-01-01',
          password: '1234',
        },
      } as any;
      const res = mockResponse();

      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error interno del servidor',
          details: 'DB Error',
        })
      );
    });
  });
});