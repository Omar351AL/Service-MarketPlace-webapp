import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth.middleware.js';

import {
  createConversationController,
  createConversationMessageController,
  getConversationController,
  listConversationMessagesController,
  listConversationsController,
  markConversationReadController
} from './conversation.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listConversationsController);
router.post('/', createConversationController);
router.get('/:conversationId', getConversationController);
router.get('/:conversationId/messages', listConversationMessagesController);
router.post('/:conversationId/read', markConversationReadController);
router.post('/:conversationId/messages', createConversationMessageController);

export default router;
