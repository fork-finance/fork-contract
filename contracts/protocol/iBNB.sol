pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../utils/SafeToken.sol";
import "./interfaces/IWETH.sol";

contract iBNB is ERC20('iBNB', 'iBNB'), Ownable {
  using SafeMath for uint256;
  using SafeToken for address;

  address public token;

  /// @dev Get token from msg.sender
  // modifier transferTokenToVault(uint256 value) {
  //   require(msg.value != 0, "msg.value == 0");
  //   require(value == msg.value, "value != msg.value");
  //   IWETH(token).deposit{value: msg.value}();
  //   SafeToken.safeTransferFrom(token, msg.sender, address(this), value);
  //   _;
  // }

  function deposit(uint256 amountToken)
    external payable {
    _deposit(amountToken);
  }

  function _deposit(uint256 amount) internal {
    require(msg.value != 0, "msg.value == 0");
    require(amount == msg.value, "amount != msg.value");
    IWETH(token).deposit{value: msg.value}();
    _mint(msg.sender, amount);
  }

  function withdraw(uint256 amount) external {
    _burn(msg.sender, amount);
    IWETH(token).withdraw(amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "wnativeRelayer: can't withdraw");
    msg.sender.transfer(amount);
  }

}
