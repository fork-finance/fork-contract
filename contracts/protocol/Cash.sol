pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


// ForkLaunch is a smart contract for distributing CHECK by asking user to stake the FORK token.
contract Cash is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

// Info of cash-pool
  struct CashPoolInfo {
    uint256 cashTotal;
    address cashToken;
    address stakeToken;
    uint256 stakeTotal;
    uint256 stakeMax;
    // uint256 stakeMin;
    uint256 startTime;
    uint256 endTime;
    bool isLimit;
    uint256 projectId;
  }

  struct CashUserInfo {
    uint256 total;
    uint256 amount;
    uint256 burn;
  }
  // Info of each pool.
  CashPoolInfo[] public cashPoolInfo;
  // Info of each user that stakes Staking tokens.
  mapping(uint256 => mapping(address => CashUserInfo)) public cashUserInfo;

  address public constant burnAddress = 0x000000000000000000000000000000000000dEaD;

  event DepositCheckToCashPool(address indexed user, uint256 indexed pid, uint256 amount);
  event CashedCheck(address indexed user, uint256 indexed pid, uint256 amount, uint256 pending);

  function addCashPool(
    uint256 _cashTotal,
    address _cashToken,
    address _stakeToken,
    uint256 _stakeMax,
    // uint256 _stakeMin,
    uint256 _startTime,
    uint256 _endTime,
    bool _isLimit,
    uint256 _projectId
  ) public  onlyOwner {
    require(_cashToken != address(0), "add: not cashToken addr");
    require(_endTime > _startTime, "endTime < startTime");
    cashPoolInfo.push(
      CashPoolInfo({
        cashTotal: _cashTotal,
        cashToken: _cashToken,
        stakeToken: _stakeToken,
        startTime: _startTime,
        endTime: _endTime,
        projectId: _projectId,
        stakeTotal: 0,
        stakeMax: _stakeMax,
        // stakeMin: _stakeMin,
        isLimit: _isLimit
      })
    );
  }

  function setCashPool(
    uint256 _pid,
    uint256 _stakeMax,
    uint256 _projectId
  ) public  onlyOwner {
    cashPoolInfo[_pid].projectId = _projectId;
    cashPoolInfo[_pid].stakeMax = _stakeMax;
  }

  function cashPoolLength() external view returns (uint256) {
    return cashPoolInfo.length;
  }
  // Deposit CHECK-TOKEN to CashPool for FPT allocation.
  function depositCheckToCashPool(uint256 _pid, uint256 _amount) public  {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][msg.sender];
    require(block.timestamp >= pool.startTime && block.timestamp <= pool.endTime, "The cash-out activity did not start");
    if (pool.isLimit) {
        require(pool.stakeTotal.add(_amount) <= pool.stakeMax, "must less than stakeMax");
    }
    IERC20(pool.stakeToken).safeTransferFrom(address(msg.sender), address(this), _amount);
    user.amount = user.amount.add(_amount);
    user.total = user.total.add(_amount);
    pool.stakeTotal = pool.stakeTotal.add(_amount);
    emit DepositCheckToCashPool(msg.sender, _pid, _amount);
  }

  function cashCheck(uint256 _pid) public  {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][msg.sender];
    require(block.timestamp > pool.endTime, "The cash-out activity did not start");
    if (pool.isLimit) {
        // require(pool.stakeTotal >= pool.stakeMin, "must more than stakeMin");
    }
    require(user.amount > 0, "nothing to cash");
    uint256 pending = pool.cashTotal.mul(user.amount).div(pool.stakeTotal);
    IERC20 cashToken = IERC20(pool.cashToken);
    IERC20 stakeToken = IERC20(pool.stakeToken);
    require(pending <= cashToken.balanceOf(address(this)), "wtf not enough cashToken");
    require(user.amount <= stakeToken.balanceOf(address(this)), "wtf not enough stakeToken-token to burn");
    // stakeToken.burn(address(this), user.amount);
    uint256 amount = user.amount;
    user.burn = user.amount;
    user.amount = 0;
    stakeToken.safeTransfer(burnAddress, amount);
    cashToken.safeTransfer(address(msg.sender), pending);
    emit CashedCheck(msg.sender, _pid, amount, pending);
    
  }

  function pendingClaim(uint256 _pid, address _user) public view returns(uint256)  {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][_user];
    if (pool.stakeTotal == 0) return 0;
    if (block.timestamp < pool.endTime) return 0;
    uint256 pending = pool.cashTotal.mul(user.amount).div(pool.stakeTotal);
    return pending;
  }
  function mayClaim(uint256 _pid, address _user) public view returns(uint256)  {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][_user];
    if (pool.stakeTotal == 0) return 0;
    uint256 pending = pool.cashTotal.mul(user.amount).div(pool.stakeTotal);
    return pending;
  }
}