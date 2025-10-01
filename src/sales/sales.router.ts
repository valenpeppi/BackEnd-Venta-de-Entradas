import { Router } from 'express';
import SalesController from './sales.controller';
import { verifyToken } from '../auth/auth.middleware'; 

const router: Router = Router();

router.post('/confirm', (req, res, next) => {
  console.log("📩 /api/sales/confirm recibido:", req.body);
  next();
}, SalesController.confirmSale);

router.get('/my-tickets', verifyToken, SalesController.getUserTickets);

export default router;

