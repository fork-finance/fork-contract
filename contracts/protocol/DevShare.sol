pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DevShare is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  string public constant name = "Fork Finance Dev Share";

  IERC20 public fork;

  uint256 public startReleaseBlock;
  uint256 public endReleaseBlock;
  uint256 public lastUnlockBlock;

  constructor(address _fork, uint256 _startReleaseBlock, uint256 _endReleaseBlock) public {
    require(_endReleaseBlock > _startReleaseBlock, "endReleaseBlock < startReleaseBlock");
    fork = IERC20(_fork);
    startReleaseBlock = _startReleaseBlock;
    endReleaseBlock = _endReleaseBlock;
    lastUnlockBlock = _startReleaseBlock;
  }

  function canUnlockAmount() public view returns (uint256) {
    uint256 bal = fork.balanceOf(address(this));
    // When block number less than startReleaseBlock, no FORKs can be unlocked
    if (block.number < startReleaseBlock) {
      return 0;
    }
    // When block number more than endReleaseBlock, all locked FORKs can be unlocked
    else if (block.number >= endReleaseBlock) {
      return bal;
    }
    // When block number is more than startReleaseBlock but less than endReleaseBlock,
    // some FORKs can be released
    else
    {
      uint256 releasedBlock = block.number.sub(lastUnlockBlock);
      uint256 blockLeft = endReleaseBlock.sub(lastUnlockBlock);
      return bal.mul(releasedBlock).div(blockLeft);
    }
  }

  function unlock(address _to) public onlyOwner {
    uint256 bal = fork.balanceOf(address(this));
    require(bal > 0, "no locked FORKs");

    uint256 amount = canUnlockAmount();
    require(bal >= amount, "wtf not enough fork");

    fork.safeTransfer(_to, amount);
    lastUnlockBlock = block.number;
  }
}