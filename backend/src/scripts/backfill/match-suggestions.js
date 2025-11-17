#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { generateSuggestionsForAllMentors } = require('../../services/matchService');

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);
  logger.info('Connected to MongoDB');

  const limit = Number(process.env.MATCH_SUGGESTION_LIMIT || 10);
  const results = await generateSuggestionsForAllMentors({ limit });

  logger.info('Match suggestion backfill completed', results);

  await mongoose.disconnect();
};

run()
  .then(() => {
    logger.info('Done');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Backfill failed:', error?.message || error);
    process.exit(1);
  });
