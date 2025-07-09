// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev A simple mock ERC20 token for testing purposes
 * This contract is used to simulate token transfers in our inheritance tests
 */
contract MockERC20 is ERC20 {
    /**
     * @dev Constructor that mints initial supply to the deployer
     * @param name The name of the token
     * @param symbol The symbol of the token  
     * @param initialSupply The initial supply of tokens to mint
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
