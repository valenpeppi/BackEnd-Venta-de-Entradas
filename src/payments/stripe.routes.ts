import express from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';

const router = express.Router();

// Crear sesión de checkout de Stripe
router.post('/checkout', async (req, res) => {
  try {
    console.log('🔍 Stripe checkout iniciado');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ No se enviaron ítems válidos');
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }

    if (!ticketGroups || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      console.error('❌ No se enviaron ticketGroups válidos');
      return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
    }

    if (!dniClient || !customerEmail) {
      console.error('❌ Faltan datos del cliente:', { dniClient, customerEmail });
      return res.status(400).json({ error: 'Faltan datos del cliente (dniClient, customerEmail)' });
    }

    console.log('🎫 Procesando ticketGroups:', ticketGroups);

    for (const g of ticketGroups) {
      const idEvent = Number(g.idEvent);
      const idPlace = Number(g.idPlace);
      const idSector = Number(g.idSector);
      const quantity = Number(g.quantity);

      console.log(`🔍 Procesando grupo:`, { idEvent, idPlace, idSector, quantity });

      if (!idEvent || !idPlace || !quantity || quantity <= 0) {
        console.warn("⚠️ ticketGroup inválido, se saltea:", g);
        continue;
      }

      // SECTOR NO ENUMERADO (entrada general)
      if (idSector === 0) {
        console.log(`🎫 Procesando sector NO enumerado para evento ${idEvent}, lugar ${idPlace}`);

        const totalAvailable = await prisma.seatEvent.count({
          where: {
            idEvent,
            idPlace,
            idSector: 0,
            state: 'available',
          },
        });

        console.log(`📊 Entradas disponibles: ${totalAvailable}, solicitadas: ${quantity}`);

        if (totalAvailable < quantity) {
          console.error(`❌ No hay suficientes entradas disponibles para evento ${idEvent}`);
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

        if (seatIds.length !== quantity) {
          console.error('❌ Error inesperado: no se pudieron encontrar suficientes IDs para reservar');
          return res.status(500).json({ error: 'No se pudo completar la reserva' });
        }

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

        // Guardar los IDs reales reservados
        g.ids = seatIds;
        console.log(`✅ Entradas generales reservadas:`, seatIds);
        continue;
      }

      // SECTOR ENUMERADO
      console.log(`🎟️ Reservando asientos enumerados para evento ${idEvent}, sector ${idSector}`);

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
        console.error(`❌ No hay suficientes asientos disponibles para evento ${idEvent}, sector ${idSector}`);
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
      console.log(`✅ Asientos reservados:`, seatIds);
    }

    // Crear sesión de Stripe
    console.log('💳 Creando sesión de Stripe...');
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
      success_url: `${process.env.FRONTEND_URL}/pay/processing`,
      cancel_url: `${process.env.FRONTEND_URL}/pay/failure`,
      metadata: {
        dniClient: String(dniClient),
        ticketGroups: JSON.stringify(ticketGroups),
      },
    });

    console.log('✅ Sesión de Stripe creada:', session.id);
    console.log('🔗 URL de checkout:', session.url);
    res.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ Error creando sesión de Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
