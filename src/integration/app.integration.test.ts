import request from 'supertest';
import app from '../../index';
jest.mock('../../src/db/mysql', () => ({
  prisma: {
    place: { findMany: jest.fn() },
    sector: { findMany: jest.fn() },
  },
}));

import { prisma } from '../../src/db/mysql';

describe('🧩 Test de Integración General - Backend Venta de Entradas', () => {
  it('GET / debería responder 404 o redirigir', async () => {
    const res = await request(app).get('/');
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/places/getPlaces debería devolver 200 y un array de lugares', async () => {
    (prisma.place.findMany as jest.Mock).mockResolvedValue([
      { idPlace: 1, name: 'Lugar Test', address: 'Calle Falsa 123', city: 'Springfield', state: 'Active' }
    ]);

    const res = await request(app).get('/api/places/getPlaces');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('name', 'Lugar Test');
  });

  it('GET /api/places/:id/sectors debería devolver sectores o array vacío', async () => {
    (prisma.sector.findMany as jest.Mock).mockResolvedValue([
      { idSector: 10, name: 'Platea', idPlace: 1 }
    ]);

    const idPlace = 1;
    const res = await request(app).get(`/api/places/${idPlace}/sectors`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/places/:id/sectors con idPlace inexistente debería devolver array vacío', async () => {
    (prisma.sector.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/places/9999/sectors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // Simulación de error interno 
  it('GET /api/places/getPlaces maneja errores del servidor correctamente', async () => {
    (prisma.place.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB Error simulado'));

    const res = await request(app).get('/api/places/getPlaces');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });
});
