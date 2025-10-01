import express from 'express';
import { preferences } from './mp';
import { prisma } from '../db/mysql';

const router = express.Router();

router.post('/checkout', async (req, res) => {
  try {
    const { eventId, ticketIds, buyerEmail, title, unitPrice } = req.body as {
      eventId: number;
      ticketIds: number[];
      buyerEmail?: string;
      title?: string;
      unitPrice?: number;
    };

    if (!eventId || !ticketIds || ticketIds.length === 0) {
      return res.status(400).json({ error: 'Faltan tickets o evento' });
    }

    // Reservar tickets en estado "pending"
    await prisma.ticket.updateMany({
      where: { idTicket: { in: ticketIds }, state: "available" },
      data: { state: "pending" }
    });

    const externalRef = `order_${eventId}_${Date.now()}`;

    const pref = await preferences.create({
      body: {
        items: [
          {
            id: String(eventId),
            title: title ?? `Evento ${eventId}`,
            quantity: ticketIds.length,
            unit_price: Number(unitPrice ?? 2000),
            currency_id: 'ARS',
          },
        ],
        payer: buyerEmail ? { email: buyerEmail } : undefined,
        external_reference: externalRef,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/pay/success`,
          failure: `${process.env.FRONTEND_URL}/pay/failure`,
          pending: `${process.env.FRONTEND_URL}/pay/failure`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mp`,
      },
    });

    return res.json({
      preferenceId: pref.id,
      externalRef,
    });
  } catch (e: any) {
    console.error('Error /checkout:', e);
    res.status(500).json({ error: e.message || 'Error creando preferencia' });
  }
});

export default router;