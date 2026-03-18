process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.PORT = process.env.PORT || '4001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test-bootstrap';

import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer: MongoMemoryReplSet;

jest.mock('@mails/RegistrationMail', () => ({
  RegistrationMail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@mails/UserReadyMail', () => ({
  UserReadyMail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@mails/NominationMail', () => ({
  NominationMail: jest.fn().mockResolvedValue(undefined),
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      ip: '127.0.0.1',
      storageEngine: 'wiredTiger',
    },
  });

  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({})
    )
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
