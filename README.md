# Death Note: Crypto Inheritance System

<!-- Test Coverage Badges -->
[![Backend Coverage](https://img.shields.io/badge/coverage-backend-lightgrey?style=flat)](backend/coverage/lcov-report/index.html)
[![Contracts Coverage](https://img.shields.io/badge/coverage-contracts-lightgrey?style=flat)](contracts/coverage/lcov-report/index.html)
[![Frontend Coverage](https://img.shields.io/badge/coverage-frontend-lightgrey?style=flat)](frontend/coverage/lcov-report/index.html)

<!--
To enable live coverage badges, sign up for Coveralls or Codecov, connect your repo, and replace the badge URLs above with the ones they provide.
-->

A full-stack dApp for managing crypto inheritance using smart contracts, a Node.js backend, and a React frontend.

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- [Hardhat](https://hardhat.org/) (installed locally via npm)
- [MetaMask](https://metamask.io/) (for frontend wallet connection)

---

## 1. Clone the Repository
```sh
git clone https://github.com/launganik/death-note.git
cd death-note
```

---

## 2. Install Dependencies
Install for all sub-projects:
```sh
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

---

## 3. Start Local Blockchain (Hardhat Node)
```sh
cd contracts
npx hardhat node
```
Leave this running in a terminal window.

---

## 4. Deploy Contracts
In a new terminal:
```sh
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
This will deploy contracts and update addresses for backend and frontend.

---

## 5. Start the Backend Server
In a new terminal:
```sh
cd backend
npm start
```
The backend will run on [http://localhost:3001](http://localhost:3001).

---

## 6. Start the Frontend
In a new terminal:
```sh
cd frontend
npm start
```
The frontend will run on [http://localhost:3000](http://localhost:3000).

---

## 7. Using the App
- **Connect your wallet** (MetaMask, using the local Hardhat network).
- **Nominate an inheritor** using the UI.
- **Trigger the death event** to transfer tokens to the inheritor.
- **Monitor balances and status** in real time.

---

## 8. Running Tests
### Contracts
```sh
cd contracts
npx hardhat test
```
### Backend
```sh
cd backend
npm test
```
### Frontend
```sh
cd frontend
npm test
```

---

## Troubleshooting
- Ensure all contract addresses are up-to-date in `backend/contractAddresses.json` and `frontend/src/contractAddresses.json` (the deploy script handles this).
- Make sure your local blockchain (Hardhat node) is running before deploying or using the app.
- If you redeploy contracts, restart backend and frontend servers.

---

## License
MIT 