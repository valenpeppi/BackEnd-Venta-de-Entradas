import express from 'express';
import axios from 'axios';
import { prisma } from '../db/mysql';

const router = express.Router();

router.post('/webhooks/mp', async (req, res) => {
  res.sendStatus(200); // MP exige respuesta rápida

  try {
    const { type, data } = req.body || {};

    if (type === 'payment' && data?.id) {
      const mpRes = await axios.get(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
      );

      const payment = mpRes.data;
      const externalRef = payment.external_reference;
      console.log("Webhook MP:", payment.status, externalRef);

      // Tickets asociados a la orden
      const tickets = await prisma.ticket.findMany({
        where: { state: "pending" }
      });

      if (payment.status === "approved") {
        // Crear venta
        const sale = await prisma.sale.create({
          data: {
            date: new Date(),
            dniClient: 12345678, // TODO: buscar user por buyerEmail o sesión
          }
        });

        await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            dateSaleItem: new Date(),
            quantity: tickets.length,
          }
        });

        await prisma.ticket.updateMany({
          where: { idTicket: { in: tickets.map(t => t.idTicket) } },
          data: {
            state: "sold",
            idSale: sale.idSale,
            dateSaleItem: new Date(),
          }
        });
      }

      if (payment.status === "rejected") {
        await prisma.ticket.updateMany({
          where: { idTicket: { in: tickets.map(t => t.idTicket) } },
          data: { state: "available" }
        });
      }
    }
  } catch (e) {
    console.error('Webhook MP error', e);
  }
});

export default router;
