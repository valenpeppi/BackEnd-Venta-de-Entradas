import express from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';

const router = express.Router();

// Crear sesión de checkout de Stripe
router.post('/checkout', async (req, res) => {
  try {
    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }

    if (!ticketGroups || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
    }

    // ✅ Reservar tickets antes de crear la sesión de Stripe
    for (const g of ticketGroups) {
      const idEvent = Number(g.idEvent);
      const idPlace = Number(g.idPlace);
      const idSector = Number(g.idSector);
      const ids = Array.isArray(g.ids) ? g.ids.map((id: any) => Number(id)) : [];

      if (!idEvent || !idPlace || !idSector || ids.length === 0) {
        console.warn("⚠️ ticketGroup inválido, se saltea:", g);
        continue;
      }

      await prisma.ticket.updateMany({
        where: {
          idTicket: { in: ids },
          idEvent,
          idPlace,
          idSector,
          state: 'available', // solo los libres
        },
        data: {
          state: 'reserved',
          reservedAt: new Date(),
        },
      });
    }

    // ✅ Crear sesión de Stripe con metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'ars',
          product_data: { name: item.name },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.FRONTEND_URL}/pay/success`,
      cancel_url: `${process.env.FRONTEND_URL}/pay/failure`,
      metadata: {
        dniClient: String(dniClient),
        ticketGroups: JSON.stringify(ticketGroups),
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
