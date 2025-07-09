<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Crypto Inheritance Project Instructions

This is a crypto inheritance project built with:
- **Smart Contracts**: Solidity with Hardhat for development and testing
- **Frontend**: React with ethers.js and web3modal for wallet connections
- **Backend**: Node.js with Express for webhook handling and smart contract interactions

## Development Guidelines

1. **Test-Driven Development**: Always write tests before implementation
2. **Smart Contract Development**: Use Hardhat for compilation, testing, and deployment
3. **Frontend Development**: Use React with modern hooks and proper wallet integration
4. **Backend Development**: Use Express with proper error handling and async/await patterns

## Project Structure

- `/contracts/` - Solidity smart contracts and Hardhat configuration
- `/backend/` - Node.js Express server for webhook handling
- `/frontend/` - React application for user interface
- Root level contains orchestration scripts and documentation

## Testing Requirements

- Smart contracts: Use Hardhat's built-in testing with ethers.js
- Backend: Use Jest for unit and integration tests
- Frontend: Use React Testing Library for component tests
- All tests should be comprehensive and cover edge cases

## Code Quality

- Write comprehensive comments explaining business logic
- Use proper error handling throughout
- Follow security best practices for smart contracts
- Implement proper input validation and sanitization
