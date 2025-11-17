const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { dbName: 'match-tests' });
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
};

const cleanup = async () => {
  const collections = mongoose.connection.collections;
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(collections)) {
    // eslint-disable-next-line no-await-in-loop
    await collections[key].deleteMany();
  }
};

module.exports = { connect, disconnect, cleanup };
