const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/responses');

// Auth middleware: accepts Bearer token header or httpOnly cookie named "token".
// Also enforces that the account is still active.
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  if (!token && req.cookies) token = req.cookies.token; // fallback
  if (!token) return fail(res, 401, 'INVALID_CREDENTIALS', 'Authentication required.');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role accountStatus');
    if (!user) {
      return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid or expired token.');
    }
    if (user.accountStatus !== 'active') {
      return fail(res, 403, 'ACCOUNT_DEACTIVATED', 'Your account is deactivated. Only an administrator can reactivate it.');
    }
    req.user = {
      id: user._id.toString(),
      role: user.role,
      accountStatus: user.accountStatus
    };
    return next();
  } catch (err) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid or expired token.');
  }
};


