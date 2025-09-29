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
      const ids = Array.isArray(g.ids) ? g.ids.map((id: any) => Number(id)) : [];

      console.log(`🔍 Procesando grupo:`, { idEvent, idPlace, idSector, ids });

      if (!idEvent || !idPlace || ids.length === 0) {
        console.warn("⚠️ ticketGroup inválido, se saltea:", g);
        continue;
      }

      // Si es sector 0 (entrada general), no verificar asientos específicos
      if (idSector === 0) {
        console.log(`🎫 Procesando entrada general para evento ${idEvent}`);
        // Para entrada general, solo verificamos que el evento tenga capacidad disponible
        const event = await prisma.event.findUnique({
          where: { idEvent },
          include: { place: true }
        });

        if (!event) {
          console.error(`❌ Evento ${idEvent} no encontrado`);
          return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Verificar capacidad total disponible
        const totalAvailable = await prisma.seatEvent.count({
          where: {
            idEvent,
            idPlace,
            state: 'available',
          },
        });

        if (totalAvailable < ids.length) {
          console.error(`❌ No hay suficientes entradas disponibles para evento ${idEvent}`);
          return res.status(400).json({ 
            error: `No hay suficientes entradas disponibles para el evento ${idEvent}` 
          });
        }

        console.log(`✅ Entrada general verificada para evento ${idEvent}`);
        continue; // No necesitamos reservar asientos específicos para entrada general
      }

      // Para sectores enumerados, verificar asientos específicos
      const availableSeats = await prisma.seatEvent.count({
        where: {
          idSeat: { in: ids },
          idEvent,
          idPlace,
          idSector,
          state: 'available',
        },
      });

      console.log(`📊 Asientos disponibles: ${availableSeats} de ${ids.length} solicitados`);

      if (availableSeats !== ids.length) {
        console.error(`❌ Asientos no disponibles para evento ${idEvent}, sector ${idSector}`);
        return res.status(400).json({ 
          error: `Algunos asientos no están disponibles para el evento ${idEvent}, sector ${idSector}` 
        });
      }

      console.log(`🔒 Reservando asientos para evento ${idEvent}, sector ${idSector}`);
      await prisma.seatEvent.updateMany({
        where: {
          idSeat: { in: ids },
          idEvent,
          idPlace,
          idSector,
          state: 'available', // solo los libres
        },
        data: {
          state: 'reserved',
        },
      });
      console.log(`✅ Asientos reservados exitosamente`);
    }

    // ✅ Crear sesión de Stripe con metadata
    console.log('💳 Creando sesión de Stripe...');
    console.log('📋 Items para Stripe:', items);
    console.log('🌐 URLs:', {
      success: `${process.env.FRONTEND_URL}/pay/success`,
      cancel: `${process.env.FRONTEND_URL}/pay/failure`
    });
    
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

    console.log('✅ Sesión de Stripe creada:', session.id);
    console.log('🔗 URL de checkout:', session.url);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
