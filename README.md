[![Contracts Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat)](contracts/coverage/lcov-report/index.html)

# Crypto Inheritance dApp
A full-stack dApp for managing crypto inheritance using smart contracts, a Node.js 
backend, and a React frontend.

## Quick Start

1. **Install dependencies** (run once):
   ```sh
   cd contracts && npm install
   cd ../backend && npm install
   cd ../frontend && npm install
   ```

2. **Start the entire system** (from `contracts` directory):
   ```sh
   npm run dev:all
   ```
   This will:
   - Start the local Hardhat node
   - Deploy contracts and update addresses
   - Start the backend server
   - Start the frontend React app

3. **Open the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Features
- Nominate an inheritor for your wallet
- Trigger inheritance transfer via death event
- Real-time status updates and token balances

## For development & troubleshooting
- Logs are saved in `contracts/node.log`, `backend.log`, and `frontend.log`
- Stop all services with Ctrl+C in the terminal running `npm run dev:all`

---

For more details, see the full documentation in each subfolder. 