// Unified response helpers to keep controllers/middleware compact & consistent.

const ok = (res, payload = {}, meta) => {
  const body = { success: true, ...payload };
  if (meta) body.meta = meta;
  return res.json(body);
};

const fail = (res, status, error, message, extra = {}) => {
  return res.status(status).json({ success: false, error, message, ...extra });
};

module.exports = { ok, fail };