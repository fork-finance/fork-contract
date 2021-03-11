pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../utils/SafeToken.sol";

contract iBUSD is ERC20('iBUSD', 'iBUSD'), Ownable {
  using SafeMath for uint256;
  using SafeToken for address;

  address public token;

  constructor(address _token) public {
    token = _token;
  }

  function deposit(uint256 amountToken)
    external payable {
    _deposit(amountToken);
  }

  function _deposit(uint256 amount) internal {
    require(msg.value == 0, "msg.value != 0");
    SafeToken.safeTransferFrom(token, msg.sender, address(this), amount);
    _mint(msg.sender, amount);
  }

  function withdraw(uint256 amount) external {
    _burn(msg.sender, amount);
    SafeToken.safeTransfer(token, msg.sender, amount);
  }

}
