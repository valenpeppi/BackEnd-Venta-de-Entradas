import { Router } from 'express';
import { login, loginCompany, register, registerCompany } from './auth.controller';
import { verifyToken, AuthRequest} from './auth.middleware';

const router: Router = Router();

// Registro y login de usuarios
router.post('/login', login);
router.post('/register', register);

// Registro y login de empresas
router.post('/register-company', registerCompany);
router.post('/login-company', loginCompany);

// Nueva ruta: validar token 
router.get('/validate', verifyToken, (req: AuthRequest, res) => {
  return res.json({
    valid: true,
    user: req.auth, 
  });
});

export default router;
