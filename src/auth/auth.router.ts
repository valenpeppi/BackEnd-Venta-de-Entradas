import { Router } from 'express';
import { loginUnified, register, registerCompany, loginCompany, updateUser, removeUser } from './auth.controller';
import { verifyToken, AuthRequest } from './auth.middleware';

const router: Router = Router();

router.put('/profile', verifyToken, updateUser);
router.delete('/profile', verifyToken, removeUser);

router.post('/login', loginUnified); // Route unificada
// router.post('/login-legacy', login); // Opcional: mantener si es muy necesario
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
