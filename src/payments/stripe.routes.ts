import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Inicializamos Stripe con la secret key del .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Endpoint para crear sesión de checkout
router.post('/checkout', async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }

    // Creamos la sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'ars', 
          product_data: {
            name: item.name,
          },
          unit_amount: item.amount, 
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.FRONTEND_URL}/pay/success`,
      cancel_url: `${process.env.FRONTEND_URL}/pay/failure`,
    });

    return res.json({ url: session.url });
  } catch (e: any) {
    console.error('Stripe checkout error:', e);
    return res.status(500).json({ error: e.message || 'Error al iniciar pago con Stripe' });
  }
});

export default router;
