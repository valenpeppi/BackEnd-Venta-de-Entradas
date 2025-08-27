import { Router } from 'express';
import SalesController from './sales.controller';

const router: Router = Router();

// Rutas protegidas por autenticación
router.post('/', SalesController.createSale);
router.get('/client/:dniClient', SalesController.getSalesByClient);

export default router;