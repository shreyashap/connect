import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware.protect);

router.post('/', chatController.getOrCreateChat);
router.get('/', chatController.getUserChats);
router.get('/:chatId/messages', chatController.getChatMessages);
router.patch('/:chatId/read', chatController.markAsRead);

export default router;
