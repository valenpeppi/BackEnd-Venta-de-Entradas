import { Router } from 'express';
// Asegúrate de que seats.controller.ts exporta un objeto por defecto (SeatsController)
import SeatsController from '../controllers/seats.controller';

const router: Router = Router();

// Público
router.get('/availability', SeatsController.getAvailableSeats);

// Admin
router.put('/:idPlace/:idSector/:idSeat', SeatsController.updateSeatState);

export default router;