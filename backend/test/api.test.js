const request = require('supertest');
const { app, server } = require('../server');

/**
 * Backend API Tests for Crypto Inheritance System
 * These tests cover the webhook endpoint and smart contract interaction
 * Following TDD approach: write tests first, then implement functionality
 */

describe('Crypto Inheritance Backend API', () => {
  
  // Set up test timeouts and teardown
  beforeAll(() => {
    jest.setTimeout(10000); // 10 seconds timeout
  });
  
  afterAll(async () => {
    // Close server connections to allow Jest to exit
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    
    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('Crypto Inheritance Backend');
    });
  });

  describe('Webhook Endpoint', () => {
    it('should accept POST request to /webhook/death-notification', async () => {
      const response = await request(app)
        .post('/webhook/death-notification')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          timestamp: Date.now(),
          eventType: 'death-notification'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Death notification received, processing inheritance transfer');
      expect(response.body.processingDelay).toBe(10000); // 10 seconds
    });

    it('should reject webhook with missing wallet address', async () => {
      const response = await request(app)
        .post('/webhook/death-notification')
        .send({
          timestamp: Date.now(),
          eventType: 'death-notification'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required field: walletAddress');
    });

    it('should reject webhook with invalid wallet address format', async () => {
      const response = await request(app)
        .post('/webhook/death-notification')
        .send({
          walletAddress: 'invalid-address',
          timestamp: Date.now(),
          eventType: 'death-notification'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid wallet address format');
    });

    it('should reject webhook with missing event type', async () => {
      const response = await request(app)
        .post('/webhook/death-notification')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          timestamp: Date.now()
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required field: eventType');
    });

    it('should prevent duplicate processing for same wallet', async () => {
      const walletAddress = '0x9999999999999999999999999999999999999999'; // Use unique address for this test
      
      // First request should succeed
      const firstResponse = await request(app)
        .post('/webhook/death-notification')
        .send({
          walletAddress,
          timestamp: Date.now(),
          eventType: 'death-notification'
        })
        .expect(200);
      
      expect(firstResponse.body.success).toBe(true);
      
      // Second request should be rejected with 409 Conflict
      const secondResponse = await request(app)
        .post('/webhook/death-notification')
        .send({
          walletAddress,
          timestamp: Date.now(),
          eventType: 'death-notification'
        })
        .expect(409);
      
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.error).toBe('Death notification already being processed for this wallet');
    });
  });

  describe('Status Endpoint', () => {
    it('should return processing status for a wallet', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      
      const response = await request(app)
        .get(`/status/${walletAddress}`)
        .expect(200);
      
      expect(response.body.walletAddress).toBe(walletAddress);
      expect(response.body.status).toBeDefined();
      expect(['idle', 'processing', 'completed', 'failed']).toContain(response.body.status);
    });

    it('should return 400 for invalid wallet address in status check', async () => {
      const response = await request(app)
        .get('/status/invalid-address')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid wallet address format');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Service Integration Tests', () => {
    it('should have contract service with proper methods', () => {
      const contractService = require('../services/contractService');
      
      expect(typeof contractService.triggerInheritance).toBe('function');
      expect(typeof contractService.getInheritor).toBe('function');
      expect(typeof contractService.getOwner).toBe('function');
      expect(typeof contractService.isTriggered).toBe('function');
    });

    it('should have websocket service for real-time updates', () => {
      const websocketService = require('../services/websocketService');
      
      expect(typeof websocketService.broadcastStatus).toBe('function');
      expect(typeof websocketService.sendToClient).toBe('function');
    });
  });
});

// Test utilities and mock data
const mockWalletAddress = '0x1234567890123456789012345678901234567890';
const mockInheritorAddress = '0x0987654321098765432109876543210987654321';
const mockTokenAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';

const testUtils = {
  generateMockWebhookPayload: (overrides = {}) => ({
    walletAddress: mockWalletAddress,
    timestamp: Date.now(),
    eventType: 'death-notification',
    ...overrides
  }),
  
  isValidEthereumAddress: (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
};

module.exports = { testUtils };
