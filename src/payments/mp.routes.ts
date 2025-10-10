import express from 'express';
import { preferences } from './mp.client';
import { prisma } from '../db/mysql';

const router = express.Router();

router.post('/checkout', async (req, res) => {
  try {
    console.log('🔁 MercadoPago checkout iniciado');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }

    if (!ticketGroups || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
    }

    if (!dniClient || !customerEmail) {
      return res.status(400).json({ error: 'Faltan datos del cliente (dniClient, customerEmail)' });
    }

    console.log('🎫 Procesando ticketGroups:', ticketGroups);

    for (const g of ticketGroups) {
      const idEvent = Number(g.idEvent);
      const idPlace = Number(g.idPlace);
      const idSector = Number(g.idSector);
      const quantity = Number(g.quantity);

      if (!idEvent || !idPlace || !quantity || quantity <= 0) {
        console.warn("⚠️ ticketGroup inválido, se saltea:", g);
        continue;
      }

      // Sector NO enumerado
      if (idSector === 0) {
        const totalAvailable = await prisma.seatEvent.count({
          where: {
            idEvent,
            idPlace,
            idSector: 0,
            state: 'available',
          },
        });

        if (totalAvailable < quantity) {
          return res.status(400).json({
            error: `No hay suficientes entradas disponibles para el evento ${idEvent}`,
          });
        }

        const availableSeats = await prisma.seatEvent.findMany({
          where: {
            idEvent,
            idPlace,
            idSector: 0,
            state: 'available',
          },
          take: quantity,
          orderBy: { idSeat: 'asc' },
        });

        const seatIds = availableSeats.map(seat => seat.idSeat);

        await prisma.seatEvent.updateMany({
          where: {
            idEvent,
            idPlace,
            idSector: 0,
            idSeat: { in: seatIds },
            state: 'available',
          },
          data: {
            state: 'reserved',
          },
        });

        g.ids = seatIds;
        continue;
      }

      // Sector enumerado
      const availableSeats = await prisma.seatEvent.findMany({
        where: {
          idEvent,
          idPlace,
          idSector,
          state: 'available',
        },
        take: quantity,
        orderBy: { idSeat: 'asc' },
      });

      if (availableSeats.length < quantity) {
        return res.status(400).json({
          error: `No hay suficientes asientos disponibles para el evento ${idEvent}, sector ${idSector}`,
        });
      }

      const seatIds = availableSeats.map(s => s.idSeat);

      await prisma.seatEvent.updateMany({
        where: {
          idEvent,
          idPlace,
          idSector,
          idSeat: { in: seatIds },
          state: 'available',
        },
        data: {
          state: 'reserved',
        },
      });

      g.ids = seatIds;
    }

    console.log('💳 Creando preferencia en MercadoPago...');
    const pref = await preferences.create({
      body: {
        items: items.map((item: any, index: number) => ({
          id: item.id?.toString() || String(index), 
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.amount) / 100, 
        })),
        payer: {
          email: customerEmail, // Guest checkout sin forzar login
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/pay/processing`,
          failure: `${process.env.FRONTEND_URL}/pay/failure`,
          pending: `${process.env.FRONTEND_URL}/pay/failure`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/mp/webhook`,
        metadata: {
          dniClient: String(dniClient),
          ticketGroups: JSON.stringify(ticketGroups),
        },
      },
    });

    console.log('✅ Preferencia creada:', pref.id);
    res.json({ preferenceId: pref.id, init_point: pref.init_point });
  } catch (error: any) {
    console.error('❌ Error creando preferencia MP:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
