pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract MockERC20 is ERC20, ERC20Detailed, ERC20Mintable {

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 supply
    ) public ERC20Detailed(name, symbol, decimals)  {
        _mint(msg.sender, supply);
    }
}