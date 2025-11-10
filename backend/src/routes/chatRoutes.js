const express = require('express');
const authenticate = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/threads', authenticate, chatController.listThreads);
router.post('/threads', authenticate, chatController.ensureThread);
router.get('/threads/:threadId/messages', authenticate, chatController.getMessages);
router.post('/threads/:threadId/messages', authenticate, chatController.sendMessage);
router.post('/threads/:threadId/read', authenticate, chatController.markThreadRead);
router.post('/pusher/auth', authenticate, chatController.authorizeChannel);

module.exports = router;
