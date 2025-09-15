/*import express from 'express';
import { preferences } from './mp';
const router = express.Router();

router.post('/checkout', async (req, res) => {
  const { eventId, quantity, buyerEmail } = req.body;

  // 1) Buscar evento y precio en tu DB (Prisma) y validar stock
  // const event = await prisma.event.findUnique({ where: { id: eventId } });
  // const unitPrice = event.price; // ARS

  const pref = await preferences.create({
    body: {
      items: [{
        id: String(eventId),
        title: 'Entrada evento',
        quantity,
        currency_id: 'ARS',
        unit_price: 10000, // <- precio desde tu DB
      }],
      payer: { email: buyerEmail },
      external_reference: `order_${eventId}_${Date.now()}`,
      back_urls: {
        success: 'https://tuapp.com/pago/success',
        failure: 'https://tuapp.com/pago/failure',
        pending: 'https://tuapp.com/pago/pending',
      },
      auto_return: 'approved',
      binary_mode: true, // solo APPROVED/REJECTED
      notification_url: 'https://tuapp.com/webhooks/mp?source_news=webhooks',
    }
  });
  // 2) Persistir tu orden "pending" con pref.id en tu DB
  // await prisma.order.create({ data: { preferenceId: pref.id, ... } });
console.log("Preference ID:", pref.id);
  // 3) Devolvés el ID y/o init_point
  return res.json({ preferenceId: pref.id, initPoint: pref.init_point });
});

export default router;

*/
import express from 'express';
import { preferences } from './mp';
// Si querés calcular precio/lugar desde tu DB, podés usar Prisma aquí:
// import { prisma } from '../db/mysql';

const router = express.Router();

/**
 * Crea UNA preferencia de Mercado Pago por compra.
 * Espera en el body:
 *  - eventId: number  (obligatorio)
 *  - quantity: number (obligatorio)
 *  - buyerEmail?: string (opcional)
 *  - title?: string, unitPrice?: number, placeName?: string (opcionales para POC)
 *
 * Nota: Lo ideal es calcular "title" y "unitPrice" en el backend con tu DB,
 *       pero te dejo ambas opciones (A: rápido, B: desde DB) comentadas.
 */
router.post('/checkout', async (req, res) => {
  try {
    const { eventId, quantity, buyerEmail, title, unitPrice, placeName } = req.body as {
      eventId: number;
      quantity: number;
      buyerEmail?: string;
      title?: string;
      unitPrice?: number;
      placeName?: string;
    };

    if (!eventId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'eventId y quantity son obligatorios' });
    }

    // 👉 Opción A (rápida para probar): uso lo que llega del FE si viene
    const computedUnit = Number(unitPrice ?? 2000);
    const computedTitle = title ?? `Evento ${eventId}` + (placeName ? ` • ${placeName}` : '');
    const description = placeName ? `Lugar: ${placeName}` : undefined;

    // 👉 Opción B (mejor): traer precio/lugar desde tu DB
    // const event = await prisma.event.findUnique({
    //   where: { idEvent: Number(eventId) },
    //   include: { place: true },
    // });
    // if (!event || !event.place) return res.status(404).json({ error: 'Evento o lugar no encontrado' });
    // const computedUnit = Number(event.price);
    // const computedTitle = `${event.name} • ${event.place.name}`;
    // const description = `Fecha: ${new Date(event.date).toLocaleString('es-AR')} · Lugar: ${event.place.name}`;

    const externalRef = `order_${eventId}_${Date.now()}`; // para trazabilidad

    const pref = await preferences.create({
      body: {
        items: [
          {
            id: String(eventId),
            title: computedTitle,
            description,
            quantity,
            unit_price: computedUnit,
            currency_id: 'ARS',
          },
        ],
        payer: buyerEmail ? { email: buyerEmail } : undefined,
        external_reference: externalRef,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/pago/exito`,
          failure: `${process.env.FRONTEND_URL}/pago/error`,
          pending: `${process.env.FRONTEND_URL}/pago/pendiente`,
        },
        auto_return: 'approved',
        // (Cuando quieras cerrar el loop) Webhook:
        // notification_url: `${process.env.BACKEND_URL}/api/webhooks/mp?source_news=webhooks`,
        // binary_mode: true, // si preferís solo approved/rejected
      },
    });

    // Devuelvo lo que el frontend necesita para REDIRIGIR al checkout:
    return res.json({
      preferenceId: pref.id,
      initPoint: (pref as any).init_point,
      externalRef,
    });
  } catch (e: any) {
    console.error('Error /checkout:', e);
    res.status(500).json({ error: e.message || 'Error creando preferencia' });
  }
});

export default router;