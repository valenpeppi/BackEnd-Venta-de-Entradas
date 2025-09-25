import express from 'express';
import { stripe } from './stripe.client';

const router = express.Router();

// Crear sesión de checkout de Stripe
router.post('/checkout', async (req, res) => {
  try {
    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }

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
        ticketGroups: JSON.stringify(ticketGroups || []), // 👈 guardamos los tickets
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creando sesión de Stripe:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
