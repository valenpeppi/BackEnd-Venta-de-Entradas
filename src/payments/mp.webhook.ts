import express from 'express';
import axios from 'axios';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';

const router = express.Router();

router.post('/', async (req, res) => {
  console.log("📩 Webhook MP recibido");
  res.sendStatus(200); 

  try {
    const { type, data } = req.body || {};

    if (type !== 'payment' || !data?.id) return;

    const mpRes = await axios.get(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = mpRes.data;
    const status = payment.status;
    const metadata = payment.metadata || {};
    const dniClient = Number(metadata.dniClient);
    const ticketGroups = JSON.parse(metadata.ticketGroups || '[]');

    console.log("📦 Metadata:", { dniClient, ticketGroups, status });

    if (!dniClient || ticketGroups.length === 0) {
      console.warn("⚠️ Metadata incompleta. No se confirma la venta.");
      return;
    }

    if (status === 'approved') {
      await SalesController.confirmSale(
        {
          body: { dniClient, tickets: ticketGroups },
          auth: { dni: dniClient },
        } as any,
        {
          status: () => ({
            json: (data: any) => {
              console.log("✅ Venta confirmada desde MP webhook:", data);
            },
          }),
        } as any
      );
    }

    if (
      status === 'rejected' ||
      status === 'cancelled' ||
      status === 'expired'
    ) {
      for (const g of ticketGroups) {
        const { idEvent, idPlace, idSector, ids } = g;
        if (!idEvent || !idPlace || !idSector || !ids?.length) continue;

        const updated = await prisma.seatEvent.updateMany({
          where: {
            idSeat: { in: ids },
            idEvent,
            idPlace,
            idSector,
            state: 'reserved',
          },
          data: {
            state: 'available',
            idSale: null,
            lineNumber: null,
          },
        });

        console.log(`🔄 Liberadas ${updated.count} entradas de MP`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error en webhook MP:', error.message || error);
  }
});

export default router;
