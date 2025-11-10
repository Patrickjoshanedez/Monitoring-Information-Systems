const mongoose = require('mongoose');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { ok, fail } = require('../utils/responses');
const { getDisplayName } = require('../utils/person');
const { isConfigured, ensureClient, triggerEvent } = require('../utils/pusher');

const THREAD_CHANNEL_PREFIX = 'private-thread-';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeUserDoc = (userDoc) => {
  if (!userDoc) return null;
  const id = userDoc._id ? userDoc._id.toString() : userDoc.toString();
  return {
    id,
    name: getDisplayName(userDoc),
    avatar: userDoc.profile?.photoUrl || null,
  };
};

const formatThread = (threadDoc, viewerId) => {
  const mentor = normalizeUserDoc(threadDoc.mentor);
  const mentee = normalizeUserDoc(threadDoc.mentee);
  const isMentorViewer = mentor?.id === viewerId;
  const counterpart = isMentorViewer ? mentee : mentor;
  const unreadCount = isMentorViewer ? threadDoc.mentorUnreadCount : threadDoc.menteeUnreadCount;

  return {
    id: threadDoc._id.toString(),
    mentor: mentor ? { id: mentor.id, name: mentor.name, avatar: mentor.avatar } : null,
    mentee: mentee ? { id: mentee.id, name: mentee.name, avatar: mentee.avatar } : null,
    lastMessage: threadDoc.lastMessage || null,
    lastMessageAt: threadDoc.lastMessageAt || threadDoc.updatedAt,
    lastSender: threadDoc.lastSender ? threadDoc.lastSender.toString() : null,
    unreadCount,
    counterpart: counterpart ? { id: counterpart.id, name: counterpart.name, avatar: counterpart.avatar } : null,
  };
};

const loadThreadForUser = async (threadId, viewerId) => {
  if (!isObjectId(threadId)) {
    return { error: { status: 400, code: 'INVALID_THREAD_ID', message: 'Invalid thread identifier.' } };
  }

  const thread = await ChatThread.findById(threadId)
    .populate('mentor', 'firstname lastname email profile.photoUrl profile.displayName role')
    .populate('mentee', 'firstname lastname email profile.photoUrl profile.displayName role');

  if (!thread) {
    return { error: { status: 404, code: 'THREAD_NOT_FOUND', message: 'Conversation not found.' } };
  }

  const isParticipant = thread.mentor._id.toString() === viewerId || thread.mentee._id.toString() === viewerId;
  if (!isParticipant) {
    return { error: { status: 403, code: 'FORBIDDEN', message: 'Access denied.' } };
  }

  return { thread };
};

const normalizeRole = (role) => (typeof role === 'string' ? role.toLowerCase() : '');

const validateRolePairing = (requesterRole, counterpartRole) => {
  const normalizedRequester = normalizeRole(requesterRole);
  const normalizedCounterpart = normalizeRole(counterpartRole);

  if (normalizedRequester === normalizedCounterpart) {
    return 'Participants must have different roles to start a conversation.';
  }
  if (!['mentor', 'mentee'].includes(normalizedRequester) || !['mentor', 'mentee'].includes(normalizedCounterpart)) {
    return 'Only mentors and mentees can use chat.';
  }
  return null;
};

const ensureChatConfigured = () => {
  if (!isConfigured()) {
    const error = new Error('Realtime chat service is not configured.');
    error.code = 'PUSHER_NOT_CONFIGURED';
    throw error;
  }
};

exports.listThreads = async (req, res) => {
  try {
    ensureChatConfigured();

    const currentRole = normalizeRole(req.user?.role);
    if (!['mentor', 'mentee'].includes(currentRole)) {
      return fail(res, 403, 'FORBIDDEN', 'Only mentors and mentees can access chat.');
    }

    const userId = req.user.id;
    const filter = currentRole === 'mentor'
      ? { mentor: userId }
      : { mentee: userId };

    const threads = await ChatThread.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate('mentor', 'firstname lastname email profile.photoUrl profile.displayName role')
      .populate('mentee', 'firstname lastname email profile.photoUrl profile.displayName role');

    const formatted = threads.map((thread) => formatThread(thread, userId));
    return ok(res, { threads: formatted }, { count: formatted.length });
  } catch (error) {
    return fail(res, 500, 'CHAT_THREADS_FETCH_FAILED', error.message);
  }
};

exports.ensureThread = async (req, res) => {
  try {
    const currentRole = normalizeRole(req.user?.role);
    if (!['mentor', 'mentee'].includes(currentRole)) {
      return fail(res, 403, 'FORBIDDEN', 'Only mentors and mentees can start conversations.');
    }

    const { participantId, participantEmail } = req.body || {};
    if (!participantId && !participantEmail) {
      return fail(res, 400, 'CHAT_PARTICIPANT_REQUIRED', 'Provide a participant id or email.');
    }

    const participantFilter = participantId
      ? { _id: participantId }
      : { email: String(participantEmail || '').trim().toLowerCase() };

    const counterpart = await User.findOne(participantFilter)
      .select('role firstname lastname email profile.photoUrl profile.displayName');

    if (!counterpart) {
      return fail(res, 404, 'CHAT_PARTICIPANT_NOT_FOUND', 'Participant not found.');
    }

    if (counterpart._id.toString() === req.user.id) {
      return fail(res, 400, 'CHAT_SELF_NOT_ALLOWED', 'You cannot start a conversation with yourself.');
    }

    const roleError = validateRolePairing(currentRole, counterpart.role);
    if (roleError) {
      return fail(res, 400, 'CHAT_ROLE_MISMATCH', roleError);
    }

    const mentorId = currentRole === 'mentor' ? req.user.id : counterpart._id;
    const menteeId = currentRole === 'mentee' ? req.user.id : counterpart._id;

    const thread = await ChatThread.findOneAndUpdate(
      { mentor: mentorId, mentee: menteeId },
      {
        $setOnInsert: {
          mentor: mentorId,
          mentee: menteeId,
          mentorUnreadCount: 0,
          menteeUnreadCount: 0,
        },
      },
      { new: true, upsert: true }
    )
      .populate('mentor', 'firstname lastname email profile.photoUrl profile.displayName role')
      .populate('mentee', 'firstname lastname email profile.photoUrl profile.displayName role');

    return ok(res, { thread: formatThread(thread, req.user.id) });
  } catch (error) {
    return fail(res, 500, 'CHAT_THREAD_CREATE_FAILED', error.message);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const access = await loadThreadForUser(threadId, req.user.id);
    if (access.error) {
      const { status, code, message } = access.error;
      return fail(res, status, code, message);
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const cursor = req.query.cursor && isObjectId(req.query.cursor) ? req.query.cursor : null;

    const messageFilter = { thread: threadId };
    if (cursor) {
      messageFilter._id = { $lt: cursor };
    }

    const messages = await ChatMessage.find(messageFilter)
      .sort({ _id: -1 })
      .limit(limit)
      .select('body sender createdAt _id');

    const ordered = messages.reverse().map((message) => ({
      id: message._id.toString(),
      threadId: threadId,
      body: message.body,
      senderId: message.sender.toString(),
      createdAt: message.createdAt,
    }));

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id.toString() : null;

    return ok(res, { messages: ordered }, { cursor: nextCursor, limit });
  } catch (error) {
    return fail(res, 500, 'CHAT_MESSAGES_FETCH_FAILED', error.message);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    ensureChatConfigured();

    const { threadId } = req.params;
    const { body } = req.body || {};
    const messageBody = typeof body === 'string' ? body.trim() : '';

    if (!messageBody) {
      return fail(res, 400, 'CHAT_MESSAGE_REQUIRED', 'Message body is required.');
    }

    if (messageBody.length > 4000) {
      return fail(res, 400, 'CHAT_MESSAGE_TOO_LONG', 'Messages must be 4000 characters or fewer.');
    }

    const access = await loadThreadForUser(threadId, req.user.id);
    if (access.error) {
      const { status, code, message } = access.error;
      return fail(res, status, code, message);
    }

    const thread = access.thread;
    const senderId = req.user.id;

    const message = await ChatMessage.create({
      thread: thread._id,
      sender: senderId,
      body: messageBody,
      readBy: [senderId],
    });

    const updateDoc = {
      $set: {
        lastMessage: messageBody,
  lastSender: new mongoose.Types.ObjectId(senderId),
        lastMessageAt: message.createdAt,
        updatedAt: message.createdAt,
      },
      $inc: {},
    };

    if (thread.mentor._id.toString() === senderId) {
      updateDoc.$set.mentorUnreadCount = 0;
      updateDoc.$inc.menteeUnreadCount = 1;
    } else {
      updateDoc.$set.menteeUnreadCount = 0;
      updateDoc.$inc.mentorUnreadCount = 1;
    }

    if (!updateDoc.$inc.mentorUnreadCount && !updateDoc.$inc.menteeUnreadCount) {
      delete updateDoc.$inc;
    }

    await ChatThread.updateOne({ _id: thread._id }, updateDoc);

    const payload = {
      id: message._id.toString(),
      threadId: thread._id.toString(),
      body: message.body,
      senderId,
      createdAt: message.createdAt,
    };

    const channel = `${THREAD_CHANNEL_PREFIX}${thread._id.toString()}`;
    await triggerEvent(channel, 'message:new', payload);
    await triggerEvent(channel, 'thread:updated', {
      threadId: thread._id.toString(),
      lastMessage: messageBody,
      lastMessageAt: message.createdAt,
      lastSender: senderId,
    });

    return ok(res, { message: payload });
  } catch (error) {
    if (error.code === 'PUSHER_NOT_CONFIGURED') {
      return fail(res, 502, 'CHAT_SERVICE_UNAVAILABLE', error.message);
    }
    return fail(res, 500, 'CHAT_MESSAGE_SEND_FAILED', error.message);
  }
};

exports.markThreadRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    const access = await loadThreadForUser(threadId, req.user.id);
    if (access.error) {
      const { status, code, message } = access.error;
      return fail(res, status, code, message);
    }

    const thread = access.thread;
    const viewerId = req.user.id;

    const update = { $set: {} };
    if (thread.mentor._id.toString() === viewerId) {
      update.$set.mentorUnreadCount = 0;
    } else {
      update.$set.menteeUnreadCount = 0;
    }

    await ChatThread.updateOne({ _id: thread._id }, update);
    await ChatMessage.updateMany(
      { thread: thread._id, readBy: { $ne: viewerId } },
      { $addToSet: { readBy: viewerId } }
    );

    const channel = `${THREAD_CHANNEL_PREFIX}${thread._id.toString()}`;
    await triggerEvent(channel, 'thread:read', {
      threadId: thread._id.toString(),
      userId: viewerId,
    });

    return ok(res, { cleared: true });
  } catch (error) {
    return fail(res, 500, 'CHAT_MARK_READ_FAILED', error.message);
  }
};

exports.authorizeChannel = async (req, res) => {
  try {
    ensureChatConfigured();

    const { channel_name: channelName, socket_id: socketId } = req.body || {};
    if (!channelName || !socketId) {
      return fail(res, 400, 'CHAT_AUTH_INVALID_REQUEST', 'Missing channel or socket identifier.');
    }

    if (!channelName.startsWith(THREAD_CHANNEL_PREFIX)) {
      return fail(res, 400, 'CHAT_AUTH_INVALID_CHANNEL', 'Unsupported channel.');
    }

    const threadId = channelName.slice(THREAD_CHANNEL_PREFIX.length);
    const access = await loadThreadForUser(threadId, req.user.id);
    if (access.error) {
      const { status, code, message } = access.error;
      return fail(res, status, code, message);
    }

    const thread = access.thread;
    const viewerDoc = thread.mentor._id.toString() === req.user.id ? thread.mentor : thread.mentee;

    const pusher = ensureClient();
    const authResponse = pusher.authorizeChannel(socketId, channelName, {
      user_id: req.user.id,
      user_info: {
        name: getDisplayName(viewerDoc),
      },
    });

    return res.send(authResponse);
  } catch (error) {
    if (error.code === 'PUSHER_NOT_CONFIGURED') {
      return fail(res, 502, 'CHAT_SERVICE_UNAVAILABLE', error.message);
    }
    return fail(res, 500, 'CHAT_CHANNEL_AUTH_FAILED', error.message);
  }
};
