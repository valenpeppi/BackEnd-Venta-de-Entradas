import request from 'supertest';
import app from '../../index';
import { prisma } from '../../src/db/mysql';

describe('🧩 Test de Integración General - Backend Venta de Entradas', () => {
  // --- 🧱 TEST BASE ---
  it('GET / debería responder 404 o redirigir', async () => {
    const res = await request(app).get('/');
    expect([200, 404]).toContain(res.status);
  });

  // --- 🏟️ GET /api/places/getPlaces ---
  it('GET /api/places/getPlaces debería devolver 200 y un array de lugares', async () => {
    const res = await request(app).get('/api/places/getPlaces');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const place = res.body[0];
      expect(place).toHaveProperty('idPlace');
      expect(place).toHaveProperty('name');
      expect(typeof place.idPlace).toBe('number');
      expect(typeof place.name).toBe('string');
    }
  });

  // --- 🧭 GET /api/places/:id/sectors ---
  it('GET /api/places/:id/sectors debería devolver sectores o array vacío', async () => {
    const idPlace = 1;
    const res = await request(app).get(`/api/places/${idPlace}/sectors`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- 🚫 GET /api/places/:id/sectors con idPlace inexistente ---
  it('GET /api/places/:id/sectors con idPlace inexistente debería devolver array vacío', async () => {
    const res = await request(app).get('/api/places/9999/sectors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // --- 💥 Simulación de error interno ---
  it('GET /api/places/getPlaces maneja errores del servidor correctamente', async () => {
    jest.spyOn(prisma.place, 'findMany').mockRejectedValueOnce(new Error('DB Error simulado'));

    const res = await request(app).get('/api/places/getPlaces');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');

    jest.restoreAllMocks();
  });
});
