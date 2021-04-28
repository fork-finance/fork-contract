pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LPLock is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  string public constant name = "Fork Finance LP Lock";

  uint256 public createdAt;
  uint256 public lockTime;

  constructor(uint256 _lockTime) public {
    lockTime = _lockTime;
    createdAt = block.timestamp;
  }

  // locked 3*30day
  modifier checkLock() {
    uint256 unlockAt =  createdAt.add(lockTime);
    require(block.timestamp>=unlockAt, "locking");
    _;
  }

  function transferAnyTo(
    address _token,
    address _to,
    uint256 _amount
  ) public onlyOwner checkLock {
    IERC20(_token).safeTransfer(_to, _amount);
  }
}