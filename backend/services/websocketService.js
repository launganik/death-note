/**
 * WebSocket Service for Crypto Inheritance System
 * Handles real-time communication with the frontend
 */

class WebSocketService {
  constructor() {
    this.io = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the WebSocket service with Socket.IO instance
   */
  init(io) {
    this.io = io;
    this.isInitialized = true;
    console.log('WebSocket service initialized');
  }

  /**
   * Broadcast status update to all clients subscribed to a wallet
   */
  broadcastStatus(walletAddress, statusData) {
    if (!this.isInitialized) {
      console.warn('WebSocket service not initialized');
      return;
    }

    try {
      // Broadcast to all clients in the wallet's room
      this.io.to(walletAddress).emit('statusUpdate', {
        walletAddress,
        ...statusData
      });

      console.log(`Status broadcast to ${walletAddress}:`, statusData);
    } catch (error) {
      console.error('Error broadcasting status:', error);
    }
  }

  /**
   * Send message to a specific client
   */
  sendToClient(socketId, eventName, data) {
    if (!this.isInitialized) {
      console.warn('WebSocket service not initialized');
      return;
    }

    try {
      this.io.to(socketId).emit(eventName, data);
      console.log(`Message sent to client ${socketId}:`, { eventName, data });
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(eventName, data) {
    if (!this.isInitialized) {
      console.warn('WebSocket service not initialized');
      return;
    }

    try {
      this.io.emit(eventName, data);
      console.log(`Message broadcast to all clients:`, { eventName, data });
    } catch (error) {
      console.error('Error broadcasting to all clients:', error);
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount() {
    if (!this.isInitialized) {
      return 0;
    }

    return this.io.engine.clientsCount;
  }

  /**
   * Get clients in a specific room (wallet address)
   */
  getClientsInRoom(walletAddress) {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const room = this.io.sockets.adapter.rooms.get(walletAddress);
      return room ? Array.from(room) : [];
    } catch (error) {
      console.error('Error getting clients in room:', error);
      return [];
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService;
