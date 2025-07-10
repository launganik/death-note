#!/bin/bash
set -e

# Start Hardhat node in the background
npx hardhat node > node.log 2>&1 &
NODE_PID=$!

# Wait for node to be ready
npx wait-on tcp:8545

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Start backend and frontend in the background
cd ../backend && npm start > backend.log 2>&1 &
BACKEND_PID=$!
cd ../frontend && npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../contracts

# Trap SIGINT/SIGTERM and kill all
trap "kill $NODE_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null" SIGINT SIGTERM

# Wait for node process (keep script running)
wait $NODE_PID 