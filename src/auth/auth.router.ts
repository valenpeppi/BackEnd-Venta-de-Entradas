import { Router } from 'express';
import { login, loginCompany, register, registerCompany } from './auth.controller';
import { verifyToken, AuthRequest} from './auth.middleware';

const router: Router = Router();

router.post('/login', login);
router.post('/register', register);

router.post('/register-company', registerCompany);
router.post('/login-company', loginCompany);

router.get('/validate', verifyToken, (req: AuthRequest, res) => {
  return res.json({
    valid: true,
    user: req.auth, 
  });
});

export default router;
