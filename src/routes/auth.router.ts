import { Router } from 'express';
import { login, loginCompany, register, registerCompany } from '../controllers/auth.controller'; // Importa todas las funciones necesarias

const router: Router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/login-company', loginCompany);     

export default router;
