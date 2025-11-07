// Utility helpers for cursor-based pagination (compact shared logic)

const parseDateCursor = (value) => {
  if (!value) return null;
  let d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const asNum = Number(value);
    if (!Number.isNaN(asNum)) d = new Date(asNum);
  }
  return Number.isNaN(d.getTime()) ? null : d;
};

module.exports = { parseDateCursor };