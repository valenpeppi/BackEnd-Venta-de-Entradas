import express from 'express';
import { StripeController } from './stripe.controller';

const router = express.Router();

router.post('/checkout', StripeController.createCheckoutSession);
router.post('/release', StripeController.releaseTickets);
router.get('/confirm-session', StripeController.confirmSession);

export default router;
