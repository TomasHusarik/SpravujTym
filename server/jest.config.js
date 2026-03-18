module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@mails/(.*)$': '<rootDir>/mails/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
  },
  clearMocks: true,
};
