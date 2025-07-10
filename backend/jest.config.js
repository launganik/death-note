module.exports = {
  testEnvironment: 'node',
  testTimeout: 7000,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  collectCoverage: false, // Disable coverage to speed up tests
  verbose: true,
  forceExit: true, // Force Jest to exit after tests complete
  detectOpenHandles: true, // Help detect what's keeping Jest alive
  maxWorkers: 1, // Use single worker to avoid resource conflicts
  testPathIgnorePatterns: ['/node_modules/']
};
