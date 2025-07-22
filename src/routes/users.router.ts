import { Router } from 'express';
// Asegúrate de que users.controller.ts exporta estas funciones nombradas
import { getAllUsers, createUser } from '../controllers/users.controller';

const router: Router = Router();

router.get('/', getAllUsers);
router.post('/', createUser);

export default router;