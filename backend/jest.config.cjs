module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': '<rootDir>/jest.transformer.cjs',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@pricing$': '<rootDir>/../shared/pricing',
  },
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  testTimeout: 30000,
  maxWorkers: 1,
};
