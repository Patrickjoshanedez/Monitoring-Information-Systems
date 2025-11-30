const express = require('express');
const authenticate = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/threads', authenticate, chatController.listThreads);
router.post('/threads', authenticate, chatController.ensureThread);
router.get('/threads/:threadId/messages', authenticate, chatController.getMessages);
router.post('/threads/:threadId/messages', authenticate, chatController.sendMessage);
router.post('/threads/:threadId/read', authenticate, chatController.markThreadRead);
router.post('/threads/:threadId/archive', authenticate, chatController.archiveThread);
router.post('/threads/:threadId/unarchive', authenticate, chatController.unarchiveThread);
router.delete('/threads/:threadId', authenticate, chatController.deleteThread);
router.post('/pusher/auth', authenticate, chatController.authorizeChannel);

module.exports = router;
