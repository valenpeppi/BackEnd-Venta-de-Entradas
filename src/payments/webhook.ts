import express from 'express';
import axios from 'axios';
const router = express.Router();

router.post('/webhooks/mp', async (req, res) => {

  res.sendStatus(200);

  try {
    const { type, data } = req.body || {};
    if (type === 'payment' && data?.id) {
      const res = await axios.get(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      });
      const payment = res.data;

    }
  } catch (e) {
    console.error('Webhook MP error', e);
  }
});

export default router;