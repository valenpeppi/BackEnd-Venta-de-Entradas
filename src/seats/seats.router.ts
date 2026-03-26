import { getSeatsForSector } from "./seats.controller";
import { Router } from 'express';

const router: Router = Router();


router.get("/events/:idEvent/sectors/:idSector/seats", getSeatsForSector);
export default router;