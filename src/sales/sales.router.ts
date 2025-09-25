import { Router } from 'express';
import SalesController from './sales.controller';

const router: Router = Router();

router.post('/confirm', SalesController.confirmSale);

export default router;
