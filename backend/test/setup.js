// Jest setup file to handle test environment configuration
process.env.NODE_ENV = 'test';

// Set test timeout
jest.setTimeout(10000);

// Global test teardown to ensure all async operations are cleaned up
afterAll(async () => {
  // Allow time for any pending async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
