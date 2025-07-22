import { Router } from 'express';
// Asegúrate de que event.controller.ts exporta estas funciones nombradas
import { createEvent, getAllEvents } from '../controllers/event.controller';

const router: Router = Router();

router.post('/', createEvent);
router.get('/', getAllEvents);

export default router;