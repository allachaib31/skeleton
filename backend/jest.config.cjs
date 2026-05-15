module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': '<rootDir>/jest.transformer.cjs',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  testTimeout: 30000,
  maxWorkers: 1,
};
