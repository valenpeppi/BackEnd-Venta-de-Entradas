import { Router } from 'express';
import { getPlaces, getSectorsByPlace} from './places.controller';


const router = Router();

router.get('/getPlaces', getPlaces);
router.get('/:idPlace/sectors', getSectorsByPlace);

export default router;  