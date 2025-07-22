import { Router } from 'express';
// Asegúrate de que sales.controller.ts exporta un objeto por defecto (SalesController)
import SalesController from '../controllers/sales.controller';

const router: Router = Router();

// Rutas protegidas por autenticación
router.post('/', SalesController.createSale);
router.get('/client/:dniClient', SalesController.getSalesByClient);

export default router;