const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const contractService = require('./services/contractService');
const websocketService = require('./services/websocketService');
const { createServer } = require('http');
const { Server } = require('socket.io');

/**
 * Express Backend Server for Crypto Inheritance System
 * Handles webhook notifications, smart contract interactions, and WebSocket connections
 */

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store processing status for wallets
const processingStatus = new Map();

// Initialize WebSocket service with io instance
websocketService.init(io);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Crypto Inheritance Backend',
    timestamp: new Date().toISOString()
  });
});

/**
 * Webhook endpoint to receive death notifications
 * Validates the payload and triggers inheritance transfer after 10 seconds
 */
app.post('/webhook/death-notification', async (req, res) => {
  try {
    console.log('[Webhook] Incoming request:', JSON.stringify(req.body, null, 2));
    const { walletAddress, timestamp, eventType } = req.body;

    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: walletAddress'
      });
    }

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: eventType'
      });
    }

    // Validate wallet address format
    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Check if already processing
    if (processingStatus.get(walletAddress) === 'processing') {
      return res.status(409).json({
        success: false,
        error: 'Death notification already being processed for this wallet'
      });
    }

    // Set processing status
    processingStatus.set(walletAddress, 'processing');

    // Respond immediately to webhook
    const responsePayload = {
      success: true,
      message: 'Death notification received, processing inheritance transfer',
      processingDelay: 6000,
      timestamp: new Date().toISOString()
    };
    res.json(responsePayload);
    console.log('[Webhook] Response sent:', JSON.stringify(responsePayload, null, 2));

    // Broadcast status update via WebSocket
    websocketService.broadcastStatus(walletAddress, {
      status: 'processing',
      message: 'Death notification received, starting 6-second delay...',
      timestamp: new Date().toISOString()
    });

    // Wait 6 seconds before triggering inheritance
    console.log(`Starting 6-second delay for wallet ${walletAddress}`);
    
    setTimeout(async () => {
      try {
        // Trigger inheritance transfer
        console.log(`Triggering inheritance for wallet ${walletAddress}`);
        
        const result = await contractService.triggerInheritance(walletAddress);
        
        if (result.success) {
          processingStatus.set(walletAddress, 'completed');
          // Broadcast success via WebSocket
          websocketService.broadcastStatus(walletAddress, {
            status: 'completed',
            message: 'Transfer complete - tokens sent to the nominee',
            transactionHash: result.transactionHash,
            nomineeAddress: result.nomineeAddress,
            timestamp: new Date().toISOString()
          });
          console.log(`Inheritance transfer completed for ${walletAddress}`);
          console.log(`[Result] Success: Transaction hash: ${result.transactionHash}, Nominee: ${result.nomineeAddress}`);
        } else {
          processingStatus.set(walletAddress, 'failed');
          // Broadcast failure via WebSocket
          websocketService.broadcastStatus(walletAddress, {
            status: 'failed',
            message: 'Inheritance transfer failed',
            error: result.error,
            nomineeAddress: result.nomineeAddress,
            timestamp: new Date().toISOString()
          });
          console.error(`Inheritance transfer failed for ${walletAddress}:`, result.error);
          console.error(`[Result] Failure: Error: ${result.error}, Nominee: ${result.nomineeAddress}`);
        }
      } catch (error) {
        processingStatus.set(walletAddress, 'failed');
        // Broadcast error via WebSocket
        websocketService.broadcastStatus(walletAddress, {
          status: 'failed',
          message: 'Internal error during inheritance transfer',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error(`Error processing inheritance for ${walletAddress}:`, error);
      }
    }, 6000); // 6 seconds delay

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Status endpoint to check processing status for a wallet
 */
app.get('/status/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  // Validate wallet address format
  if (!isValidEthereumAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address format'
    });
  }

  const status = processingStatus.get(walletAddress) || 'idle';

  res.json({
    walletAddress,
    status,
    timestamp: new Date().toISOString()
  });
});

/**
 * Approve tokens endpoint
 * Allows a wallet to approve the inheritance contract to spend tokens
 */
app.post('/approve-tokens', async (req, res) => {
  try {
    console.log('[Approve] Incoming request:', JSON.stringify(req.body, null, 2));
    const { walletAddress, amount } = req.body;

    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: walletAddress'
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: amount'
      });
    }

    // Validate wallet address format
    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Approve tokens
    const result = await contractService.approveTokens(walletAddress, amount);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Token approval successful',
        transactionHash: result.transactionHash,
        approvedAmount: result.approvedAmount,
        timestamp: new Date().toISOString()
      });
      console.log(`Token approval successful for ${walletAddress}: ${result.approvedAmount} tokens`);
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
      console.error(`Token approval failed for ${walletAddress}:`, result.error);
    }

  } catch (error) {
    console.error('Token approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * 404 handler for unknown routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/**
 * Utility function to validate Ethereum address format
 */
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * WebSocket connection handling
 */
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (walletAddress) => {
    if (isValidEthereumAddress(walletAddress)) {
      socket.join(walletAddress);
      console.log(`Client ${socket.id} subscribed to updates for ${walletAddress}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Crypto Inheritance Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time updates`);
  });
}

// Export both app and server for testing
module.exports = { app, server };
