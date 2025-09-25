import express, { Request, Response } from 'express';
import { stripe } from './stripe.client';
import SalesController from '../sales/sales.controller';

const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      try {
        const dniClient = session.metadata?.dniClient;
        const ticketGroups = JSON.parse(session.metadata?.ticketGroups || '[]');

        // Reusar confirmSale del controller
        await SalesController.confirmSale(
          { body: { dniClient, tickets: ticketGroups } } as any,
          res
        );

        console.log(`✅ Venta confirmada automáticamente por webhook (dni: ${dniClient})`);
      } catch (error) {
        console.error('Error confirmando venta desde webhook:', error);
      }
    }

    res.json({ received: true });
  }
);

export default router;
