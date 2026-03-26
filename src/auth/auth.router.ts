import { Router } from 'express';
import {
    register,
    loginUnified,
    registerCompany,
    loginCompany,
    googleLogin,
    updateUser,
    removeUser,
    validateSession,
    checkPasswordStrength,
    forgotPassword,
    resetPassword,
    changePassword
} from './auth.controller';
import * as authMiddleware from './auth.middleware';

const router: Router = Router();

router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/login', loginUnified);
router.post('/login-company', loginCompany);
router.post('/google', googleLogin);
router.post('/check-password-strength', checkPasswordStrength);

 
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware.verifyToken, changePassword);

router.put('/profile', authMiddleware.verifyToken, updateUser);
router.delete('/profile', authMiddleware.verifyToken, removeUser);

router.get('/validate', authMiddleware.verifyToken, validateSession);

export default router;
