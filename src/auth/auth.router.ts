import { Router } from 'express';
import * as authController from './auth.controller';
import * as authMiddleware from './auth.middleware';

const router: Router = Router();

router.post('/register', authController.register);
router.post('/register-company', authController.registerCompany);
router.post('/login', authController.loginUnified);
router.post('/login-company', authController.loginCompany);
router.post('/google', authController.googleLogin);
router.post('/check-password-strength', authController.checkPasswordStrength);

router.put('/profile', authMiddleware.verifyToken, authController.updateUser);
router.delete('/profile', authMiddleware.verifyToken, authController.removeUser);

router.get('/validate', authMiddleware.verifyToken, authController.validateSession);

export default router;
