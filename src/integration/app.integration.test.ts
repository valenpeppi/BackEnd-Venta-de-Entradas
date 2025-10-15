import request from 'supertest';
import app from '../../index'; 

describe('🧩 Test de Integración General - Backend Venta de Entradas', () => {

  it('GET / debería responder 404 o redirigir', async () => {
    const res = await request(app).get('/');
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/places/getPlaces debería devolver 200 y un array de lugares', async () => {
    const res = await request(app).get('/api/places/getPlaces');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const place = res.body[0];
      expect(place).toHaveProperty('idPlace');
      expect(place).toHaveProperty('name');
    }
  });

  it('GET /api/places/:id/sectors debería devolver sectores o array vacío', async () => {
    const idPlace = 1;
    const res = await request(app).get(`/api/places/${idPlace}/sectors`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});