import { Router } from 'express';
import SalesController from './sales.controller';

const router: Router = Router();

router.post('/confirm', (req, res, next) => {
  console.log("📩 /api/sales/confirm recibido:", req.body);
  next();
}, SalesController.confirmSale);

export default router;
