import express from 'express';
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
        success: 'https://tuapp.com/pago/exito',
        failure: 'https://tuapp.com/pago/error',
        pending: 'https://tuapp.com/pago/pendiente',
      },
      auto_return: 'approved',
      binary_mode: true, // solo APPROVED/REJECTED
      notification_url: 'https://tuapp.com/webhooks/mp?source_news=webhooks',
    }
  });

  // 2) Persistir tu orden "pending" con pref.id en tu DB
  // await prisma.order.create({ data: { preferenceId: pref.id, ... } });

  // 3) Devolvés el ID y/o init_point
  return res.json({ preferenceId: pref.id, initPoint: pref.init_point });
});

const preference = new Preference(client);

preference.create({
  body: {
    items: [
      {
        title: 'Mi producto',
        quantity: 1,
        unit_price: 2000
      }
    ],
  }
})
.then(console.log)
.catch(console.log);

export default router;

