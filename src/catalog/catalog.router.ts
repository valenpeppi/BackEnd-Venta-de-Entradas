import { Router } from 'express';
import { getEventTypes, getPlaces, getSectorsByPlace } from './catalog.controller';

const router: Router = Router();

router.get('/event-types', getEventTypes);
router.get('/places', getPlaces);
router.get('/places/:idPlace/sectors', getSectorsByPlace);

export default router;