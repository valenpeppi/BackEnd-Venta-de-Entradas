import { getSeatsForSector } from "./seats.controller";
import { Router } from 'express';

const router: Router = Router();


router.get("/:idEvent/:idPlace/:idSector", getSeatsForSector);

export default router;