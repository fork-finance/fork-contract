pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAOTreasury is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  string public constant name = "Fork Finance DAO Treasury";

  IERC20 public fork;

  constructor(address _fork) public {
    fork = IERC20(_fork);
  }

  function transferForkTo(
    address _to,
    uint256 _amount
  ) public onlyOwner {
    fork.safeTransfer(_to, _amount);
  }

  function transferAnyTo(
    address _token,
    address _to,
    uint256 _amount
  ) public onlyOwner {
    IERC20(_token).safeTransfer(_to, _amount);
  }
}