import Stripe from 'stripe';
import { env } from '../config/env';

const STRIPE_KEY = (env.STRIPE_SECRET_KEY ?? '') as string;

export const stripe = new Stripe(STRIPE_KEY, {
  typescript: true,
});
