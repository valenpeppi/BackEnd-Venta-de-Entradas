import Stripe from 'stripe';
import { env } from '../config/env';

// ⚙️ Si la clave no existe (p. ej. en entorno test), usamos una dummy
const stripeKey = env.STRIPE_SECRET_KEY || 'sk_test_dummy_key';

// ✅ Cliente Stripe configurado correctamente
export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-08-27.basil', // o Stripe.ApiVersion
});
