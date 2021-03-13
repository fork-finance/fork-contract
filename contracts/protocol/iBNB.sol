pragma solidity 0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../utils/SafeToken.sol";
import "./interfaces/IWETH.sol";
import "./WNativeRelayer.sol";
import '@openzeppelin/contracts/utils/Address.sol';

contract iBNB is ERC20('iBNB', 'iBNB'), Ownable {
  using SafeMath for uint256;
  using SafeToken for address;
  using Address for address;

  address public token;
  address public wNativeRelayerAddr;

  constructor(address _token, address _wNativeRelayerAddr) public {
    token = _token;
    wNativeRelayerAddr = _wNativeRelayerAddr;
  }

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
    require(balanceOf(msg.sender)>=amount, "burn amount exceeds balance");
    _burn(msg.sender, amount);
    // IWETH(token).withdraw(amount);
    SafeToken.safeTransfer(token, wNativeRelayerAddr, amount);
    WNativeRelayer(uint160(wNativeRelayerAddr)).withdraw(amount);
    msg.sender.transfer(amount);
  }

  receive() external payable {}

}
