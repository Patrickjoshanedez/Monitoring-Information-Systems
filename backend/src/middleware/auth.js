const jwt = require('jsonwebtoken');
const { fail } = require('../utils/responses');

// Auth middleware: accepts Bearer token header or httpOnly cookie named "token".
// Keeps response compact & consistent via response helper.
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  if (!token && req.cookies) token = req.cookies.token; // fallback
  if (!token) return fail(res, 401, 'INVALID_CREDENTIALS', 'Authentication required.');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
    return next();
  } catch (err) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid or expired token.');
  }
};


