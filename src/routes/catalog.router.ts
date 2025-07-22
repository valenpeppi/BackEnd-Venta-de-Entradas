import { Router } from 'express';
// Importa las funciones del controlador
import { getEventTypes, getPlaces, getSectorsByPlace } from '../controllers/catalog.controller';

const router: Router = Router();

router.get('/event-types', getEventTypes);
router.get('/places', getPlaces);
router.get('/places/:idPlace/sectors', getSectorsByPlace);

export default router;