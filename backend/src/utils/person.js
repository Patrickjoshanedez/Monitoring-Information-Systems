// Person utility helpers to compact name formatting logic across controllers/services.

const getFullName = (user) => {
  if (!user) return '';
  return [user.firstname, user.lastname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const getDisplayName = (user) => {
  if (!user) return 'Unknown user';
  const full = getFullName(user);
  return full || user.email || 'User';
};

const personFromUser = (user) => ({
  id: user ? user._id?.toString() : null,
  name: getDisplayName(user),
  email: user?.email || null,
});

module.exports = { getFullName, getDisplayName, personFromUser };