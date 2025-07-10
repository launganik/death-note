// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CryptoInheritance
 * @dev A smart contract that manages crypto inheritance by allowing an owner to nominate 
 * an inheritor who can receive ERC20 tokens upon a trigger event (such as death)
 */
contract CryptoInheritance is Ownable, Pausable {
    
    // State variables
    address public inheritor;
    bool public isTriggered;
    
    // Events
    event InheritorNominated(address indexed inheritor);
    event InheritanceTriggered(address indexed token, address indexed inheritor);
    event NominationCancelled();
    
    // Modifiers
    modifier notTriggered() {
        require(!isTriggered, "Inheritance already triggered");
        _;
    }
    
    /**
     * @dev Constructor sets the deployer as the owner
     */
    constructor() Ownable(msg.sender) {
        isTriggered = false;
    }
    
    /**
     * @dev Nominate an inheritor who will receive tokens upon trigger
     * @param _inheritor The address of the inheritor
     */
    function nominateInheritor(address _inheritor) external whenNotPaused {
        require(_inheritor != address(0), "Inheritor cannot be zero address");
        
        inheritor = _inheritor;
        emit InheritorNominated(_inheritor);
    }
    
    /**
     * @dev Cancel the current nomination
     */
    function cancelNomination() external whenNotPaused {
        inheritor = address(0);
        emit NominationCancelled();
    }
    
    /**
     * @dev Trigger the inheritance transfer for a specific ERC20 token
     * @param tokenAddress The address of the ERC20 token to transfer
     */
    function triggerInheritance(address tokenAddress) external whenNotPaused notTriggered {
        require(inheritor != address(0), "No inheritor nominated");
        
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(msg.sender);
        
        require(balance > 0, "No tokens to transfer");
        
        // Transfer all tokens from the caller (deceased) to inheritor
        require(token.transferFrom(msg.sender, inheritor, balance), "Token transfer failed");
        
        isTriggered = true;
        emit InheritanceTriggered(tokenAddress, inheritor);
    }
    
    /**
     * @dev Get the current inheritor address
     * @return The address of the current inheritor
     */
    function getInheritor() external view returns (address) {
        return inheritor;
    }
    
    /**
     * @dev Get the owner address
     * @return The address of the owner
     */
    function getOwner() external view returns (address) {
        return owner();
    }
    
    /**
     * @dev Pause the contract (emergency function)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
