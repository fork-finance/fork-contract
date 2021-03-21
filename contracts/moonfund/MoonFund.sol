pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/utils/Address.sol';

import "./sForkToken.sol";
import "./interfaces/IMoonFund.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./owner/Operator.sol";

import "../protocol/interfaces/IWETH.sol";

contract MoonFund is
  IMoonFund,
  Ownable,
  Operator
{
  using SafeMath for uint256;
  using Address for address;
  using SafeERC20 for IERC20;

  // The TOKEN
  sForkToken public sfork;
  IERC20 public fork;
  address public weth;

  IUniswapV2Router02 public router;

  // Dev address.
  address public devaddr;

  uint256 public startTime;
  uint256 public endTime;

  uint256 public totalCrowdfundingOfETH = 10000e18;

  mapping(address => uint256) userTotalDeposit;

  bool public isSetForkAddress;
  uint256 createdAt;

  // cash pool
  struct CashPool {
    uint256 point;
    uint256 startTime;
  }

  CashPool[] public cashPool;

  mapping(uint256 => mapping(address => uint256)) public userCashed;

  event Deposit(address indexed user, uint256 amount);
  event Cashed(address indexed user, uint256 indexed pid, uint256 amount);
  event SwapExacted(address indexed user, address indexed token0,address indexed token1, uint256 amountIn);

  constructor(
    IUniswapV2Router02 _router,
    sForkToken _sfork,
    address _weth,
    address _devaddr,
    uint256 _startTime,
    uint256 _endTime
    // uint256 _totalCrowdfundingOfETH
  ) public {
    router = _router;
    sfork = _sfork;
    weth = _weth;
    devaddr = _devaddr;
    startTime = _startTime;
    endTime = _endTime;
    isSetForkAddress = false;
    // totalCrowdfundingOfETH = _totalCrowdfundingOfETH;
  }

  modifier checkActive() {
    require(block.timestamp >= startTime, 'crowdfunding: not start');
    require(block.timestamp < endTime, 'crowdfunding: is over');
    _;
  }

  modifier checkCash(uint256 pid) {
    require(isSetForkAddress, "cashing not active");
    require(block.timestamp >= cashPool[pid].startTime, 'cashing: not start');
    _;
  }

  function setDev(address _devaddr) public {
    require(msg.sender == devaddr, "dev: wut?");
    devaddr = _devaddr;
  }

  // transfer $fork to moon-fund and set the fork address when fork deployed 
  function setForkAddress(address _fork) public onlyOperator {
    require(_fork != address(0), "add: not _fork addr");
    fork = IERC20(_fork);
    isSetForkAddress = true;
    createdAt = block.timestamp;
  }

  function addCashPool(uint256 _point, uint256 _startTime) public override onlyOperator {
    uint256 allPoint = _point.add(poolsPoint());
    require(allPoint<100, "add: all haven cashed");
    require(_startTime >= block.timestamp, "add: startTime must > current time");
    cashPool.push(
      CashPool({
        point: _point,
        startTime: _startTime
      })
    );
  }

  function poolsPoint() public view returns (uint256) {
    uint256 currentPoint = 0;
    uint256 length = cashPool.length;
    for (uint256 _pid = 0; _pid < length; _pid++) {
      currentPoint = currentPoint.add(cashPool[_pid].point);
    }
    return currentPoint;
  }

  function poolLength() external override view returns (uint256) {
    return cashPool.length;
  }

  /**
  * crowdfunding
  */
  function deposit(uint256 amount)
  external override payable checkActive {
    _deposit(amount);
  }
  
  function _deposit(uint256 amount) internal {
    require(msg.value != 0, "msg.value == 0");
    require(amount == msg.value, "amount != msg.value");
    uint256 rewards = amount.mul(sfork.cap()).div(totalCrowdfundingOfETH);
    IWETH(weth).deposit{value: msg.value}();
    IERC20(weth).safeTransfer(devaddr, amount.div(10));
    sfork.mint(msg.sender, rewards);
    userTotalDeposit[msg.sender] = userTotalDeposit[msg.sender].add(amount);
    emit Deposit(msg.sender, amount);
  }

  /**
   * cash
   */

  function cash(uint256 _pid, uint256 _amount) external override {
    _cash(_pid, _amount);
  }

  function pendingCash(uint256 _pid, address _user) external override view returns (uint256) {
    return cash_limit(_pid, _user);
  }

  function _cash(uint256 _pid, uint256 _amount) internal checkCash(_pid) {
    uint256 maxCash = cash_limit(_pid, msg.sender);
    require(_amount<=maxCash, 'cashing: amount > maxlimit');
    sfork.burn(msg.sender, _amount);
    fork.safeTransfer(msg.sender, _amount);
    userCashed[_pid][msg.sender] = userCashed[_pid][msg.sender].add(_amount);
    emit Cashed(msg.sender, _pid, _amount);
  }

  function cash_limit(uint256 _pid, address _user) public view returns (uint256) {
   return userTotalDeposit[_user].mul(cashPool[_pid].point).div(100).sub(userCashed[_pid][_user]);
  }

  /**
   * buy
   */
  function toTheMoon(uint256 _amount, uint256 _amountOutMin) external onlyOperator {
    address[] memory path = new address[](2);
    path[0] = weth;
    path[1] = address(fork);
    _approve(IERC20(weth), address(router), _amount);
    _swapExactTokensForTokens(_amount, _amountOutMin, path);
  }

  function slowDown(uint256 _amount, uint256 _amountOutMin) external onlyOperator {
    address[] memory path = new address[](2);
    path[0] = address(fork);
    path[1] = weth;
    _approve(fork, address(router), _amount);
    _swapExactTokensForTokens(_amount, _amountOutMin, path);
  }
  

  // Buy in specified quantity
  function _swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] memory path
  ) internal {
    address to = address(this);
    uint256 deadline = block.timestamp + 1800;
    bytes memory data = abi.encodeWithSelector(router.swapTokensForExactTokens.selector, amountOut, amountInMax, path, to, deadline);
    bytes memory returndata = address(router).functionCall(data, "Buy: low-level swapTokensForExactTokens() call failed");
    if (returndata.length > 0) {
      require(abi.decode(returndata, (bool)), "Buy: operation swapTokensForExactTokens() did not succeed");
    }
  }

  // Sell in specified quantity
  function _swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] memory path
    ) internal {
    address to = address(this);
    uint256 deadline = block.timestamp + 1800;
    bytes memory data = abi.encodeWithSelector(router.swapExactTokensForTokens.selector, amountIn, amountOutMin, path, to, deadline);
    bytes memory returndata = address(router).functionCall(data, "Sell: low-level swapExactTokensForTokens() call failed");
    if (returndata.length > 0) {
      require(abi.decode(returndata, (bool)), "Sell: operation swapExactTokensForTokens() did not succeed");
      emit SwapExacted(address(this), path[0], path[1], amountIn);
    }
  }

  function _approve(IERC20 token, address spender,uint256 amount) internal {
    if ((amount == 0) || (token.allowance(address(this), spender) == 0)) {
      token.safeApprove(spender, amount);
    } else if(token.allowance(address(this), spender) < amount) {
      token.safeIncreaseAllowance(spender, amount);
    } else {
      token.safeDecreaseAllowance(spender, amount);
    }
  }

  // locked 3*30day
  // owned by timelock;
  // all withdraw must after lock and by timelock
  modifier checkLock() {
    uint256 unlockAt =  createdAt.add(3600*24*30*3);
    require(block.timestamp>=unlockAt, "locking");
    _;
  }

  function withdrawEth(uint256 _amount) external checkLock onlyOwner {
    IWETH(weth).withdraw(_amount);
    msg.sender.transfer(_amount);
  }

  function withdrawFork(address _to, uint256 _amount) external checkLock onlyOwner {
    fork.safeTransfer(_to, _amount);
  }

  receive() external payable {}
}