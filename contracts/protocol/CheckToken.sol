pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// CheckToken with Governance.
contract CheckToken is ERC20("CheckToken", "CHECK"), Ownable {

  constructor() public {
    _setupDecimals(18);
    // maunalMint 250k for seeding liquidity
    mint(msg.sender, 250000e18);
  }

  function mint(address _to, uint256 _amount) public onlyOwner {
    _mint(_to, _amount);
  }

  function burn(address _account, uint256 _amount) public onlyOwner {
    _burn(_account, _amount);
  }

  function transferAll(address _to) public {
    _transfer(msg.sender, _to, balanceOf(msg.sender));
  }
}