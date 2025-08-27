import { Router } from 'express';
import { getAllUsers, createUser,} from './users.controller';

const router: Router = Router();

router.get('/', getAllUsers);
router.post('/', createUser);
export default router;