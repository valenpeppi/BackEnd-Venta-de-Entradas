import { getReservedSeatsForSector } from "./seats.controller";
import { Router } from 'express';

const router: Router = Router();


router.get("/reserved/:idEvent/:idPlace/:idSector", getReservedSeatsForSector);

export default router;