import { Router } from 'express';
import * as messageController from './messages.controller';
import { verifyToken, isAdmin } from '../auth/auth.middleware';

const router: Router = Router();

// Public
router.post('/', messageController.createMessage);

// Admin only routes
router.get('/', verifyToken, isAdmin, messageController.getMessages);
router.put('/:id/reply', verifyToken, isAdmin, messageController.replyMessage);
router.put('/:id/reject', verifyToken, isAdmin, messageController.rejectMessage);
router.put('/:id/discard', verifyToken, isAdmin, messageController.discardMessage);

export default router;
