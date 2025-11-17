const express = require('express');
const auth = require('../middleware/auth');
const {
  getMatchSuggestions,
  getMatchSuggestionDetail,
  getMenteeMatchSuggestions,
  acceptMatch,
  declineMatch,
  menteeAcceptMatch,
  menteeDeclineMatch,
  listMentorMatches,
  listMenteeMatches,
  generateSuggestionsJob,
} = require('../controllers/matchController');

const router = express.Router();

router.get('/mentors/:mentorId/match-suggestions', auth, getMatchSuggestions);
router.get('/mentors/:mentorId/match-suggestions/:matchId', auth, getMatchSuggestionDetail);
router.get('/mentors/:mentorId/matches', auth, listMentorMatches);
router.get('/mentees/:menteeId/match-suggestions', auth, getMenteeMatchSuggestions);
router.get('/mentees/:menteeId/matches', auth, listMenteeMatches);
router.post('/matches/:id/accept', auth, acceptMatch);
router.post('/matches/:id/decline', auth, declineMatch);
router.post('/matches/:id/mentee-accept', auth, menteeAcceptMatch);
router.post('/matches/:id/mentee-decline', auth, menteeDeclineMatch);
router.post('/matches/generate', auth, generateSuggestionsJob);

module.exports = router;
