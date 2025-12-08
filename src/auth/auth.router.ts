import { Router } from 'express';
import { loginUnified, register, registerCompany, loginCompany, updateUser, removeUser } from './auth.controller';
import { verifyToken, AuthRequest } from './auth.middleware';

const router: Router = Router();
export default router;
