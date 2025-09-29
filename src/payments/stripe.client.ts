import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está configurado en las variables de entorno');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);