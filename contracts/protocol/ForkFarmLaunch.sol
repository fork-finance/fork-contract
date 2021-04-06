pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./CheckToken.sol";

// ForkLaunch is a smart contract for distributing CHECK by asking user to stake the FORK token.
contract ForkFarmLaunch is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  using SafeERC20 for CheckToken;

  // Info of each user.
  struct UserInfo {
    uint256 amount; // How many Staking tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
    //
    // We do some fancy math here. Basically, any point in time, the amount of CHECKs
    // entitled to a user but is pending to be distributed is:
    //
    //   pending reward = (user.amount * pool.accCheckPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws Staking tokens to a pool. Here's what happens:
    //   1. The pool's `accCheckPerShare` (and `lastRewardBlock`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.
  }

  // Info of each pool.
  struct PoolInfo {
    address stakeToken; // Address of Staking token contract.
    uint256 allocPoint; // How many allocation points assigned to this pool. CHECKs to distribute per block.
    uint256 lastRewardBlock; // Last block number that CHECKs distribution occurs.
    uint256 accCheckPerShare; // Accumulated CHECKs per share, times 1e12. See below.
    uint256 accCheckPerShareTilBonusEnd; // Accumated CHECKs per share until Bonus End.
    uint256 projectId;
    uint256 lpSupply;
  }

  // Info of cash-pool
  struct CashPoolInfo {
    uint256 cashTotal;
    address cashToken;
    uint256 stakeTotal;
    uint256 startBlock;
    uint256 endBlock;
  }

  struct CashUserInfo {
    uint256 amount;
  }
  // Info of each pool.
  CashPoolInfo[] public cashPoolInfo;
  // Info of each user that stakes Staking tokens.
  mapping(uint256 => mapping(address => CashUserInfo)) public cashUserInfo;

  // The Check TOKEN!
  CheckToken public check;
  // Dev address.
  address public devaddr;
  // CHECK tokens created per block.
  uint256 public checkPerBlock;
  // muliplier
  uint256 public BONUS_MULTIPLIER = 1;

  // Info of each pool.
  PoolInfo[] public poolInfo;
  // Info of each user that stakes Staking tokens.
  mapping(uint256 => mapping(address => UserInfo)) public userInfo;
  // Total allocation points. Must be the sum of all allocation points in all pools.
  uint256 public totalAllocPoint = 0;
  // The block number when CHECK mining starts.
  uint256 public startBlock;
  
  event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
  event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
  event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
  event DepositCheckToCashPool(address indexed user, uint256 indexed pid, uint256 amount);
  event CashedCheck(address indexed user, uint256 indexed pid, uint256 amount, uint256 pending);

  constructor(
    CheckToken _check,
    address _devaddr,
    uint256 _checkPerBlock,
    uint256 _startBlock
  ) public {
    check = _check;
    devaddr = _devaddr;
    checkPerBlock = _checkPerBlock;
    startBlock = _startBlock;
  }

  /**
   * setting
   */

  // Update dev address by the previous dev.
  function setDev(address _devaddr) public {
    require(msg.sender == devaddr, "dev: wut?");
    devaddr = _devaddr;
  }

  function updateCheckPerBlock(uint256 _checkPerBlock) public onlyOwner {
    checkPerBlock = _checkPerBlock;
  }

  function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
    BONUS_MULTIPLIER = multiplierNumber;
  }

  function updatePoolPorjectId(uint256 _pid, uint256 _projectId) public onlyOwner {
    poolInfo[_pid].projectId = _pid;
  }

  function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

  // Add a new lp to the pool. Can only be called by the owner.
  function add(
    uint256 _projectId,
    uint256 _allocPoint,
    address _stakeToken,
    bool _withUpdate
  ) public  onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    require(_stakeToken != address(0), "add: not stakeToken addr");
    // check exisit
    require(!isDuplicatedPool(_projectId, _stakeToken), "add: stakeToken dup");

    uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
    totalAllocPoint = totalAllocPoint.add(_allocPoint);
    poolInfo.push(
      PoolInfo({
        projectId: _projectId,
        stakeToken: _stakeToken,
        allocPoint: _allocPoint,
        lastRewardBlock: lastRewardBlock,
        accCheckPerShare: 0,
        totalStakeToken: 0
      })
    );
    updateStakingPool();
  }

  // Update the given pool's CHECK allocation point. Can only be called by the owner.
  function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
    poolInfo[_pid].allocPoint = _allocPoint;
    if (prevAllocPoint != _allocPoint) {
      totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
      updateStakingPool();
    }
  }

  function updateStakingPool() internal {
    uint256 length = poolInfo.length;
    uint256 points = 0;
    uint256[] memory tmpPoolId;
    for (uint256 pid = 0; pid < length; ++pid) {
      if (poolInfo[projectId] == 0) {
        tmpPoolId.push(pid);
        tmpPoints.add(poolInfo[pid].allocPoint);
        continue;
      }
      points = points.add(poolInfo[pid].allocPoint);
    }
    if (points != 0) {
      points = points.div(tmpPoolId.length.sub(1).mul(3));
      for (uint256 tpid = 0; tpid < tmpPoolId.length; ++tpid) {
        totalAllocPoint = totalAllocPoint.sub(poolInfo[tpid].allocPoint).add(points);
        poolInfo[tpid].allocPoint = points;
      }
      
    }
  }

  // Return reward multiplier over the given _from to _to block.
  function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
    return _to.sub(_from).mul(BONUS_MULTIPLIER);
  }

  function addCashPool(
    uint256 _cashTotal,
    address _cashToken,
    uint256 _startBlock,
    uint256 _endBlock
  ) public  onlyOwner {
    require(_cashToken != address(0), "add: not cashToken addr");
    require(_endBlock > _startBlock, "_endBlock < _startBlock");
    cashPoolInfo.push(
      CashPoolInfo({
        cashTotal: _cashTotal,
        cashToken: _cashToken,
        startBlock: _startBlock,
        endBlock: _endBlock,
        stakeTotal: 0
      })
    );
  }

  function setCashPool(
    uint256 _pid,
    uint256 _cashTotal,
    address _cashToken,
    uint256 _startBlock,
    uint256 _endBlock
  ) public  onlyOwner {
    require(_cashToken != address(0), "add: not cashToken addr");
    require(_endBlock > _startBlock, "_endBlock < _startBlock");

    cashPoolInfo[_pid].cashTotal = _cashTotal;
    cashPoolInfo[_pid].cashToken = _cashToken;
    cashPoolInfo[_pid].startBlock = _startBlock;
    cashPoolInfo[_pid].endBlock = _endBlock;
  }

  /**
   * core
   */

  function isDuplicatedPool(uint256 _projectId, address _stakeToken) public view returns (bool) {
    uint256 length = poolInfo.length;
    for (uint256 _pid = 0; _pid < length; _pid++) {
      if( poolInfo[_pid].projectId == _projectId && poolInfo[_pid].stakeToken == _stakeToken) return true;
    }
    return false;
  }


  // View function to see pending CHECKs on frontend.
  function pendingCheck(uint256 _pid, address _user) external  view returns (uint256) {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_user];
    uint256 accCheckPerShare = pool.accCheckPerShare;
    uint256 lpSupply = pool.lpSupply;
    if (block.number > pool.lastRewardBlock && lpSupply != 0) {
      uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
      uint256 checkReward = multiplier.mul(checkPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
      accCheckPerShare = accCheckPerShare.add(checkReward.mul(1e12).div(lpSupply));
    }
    return user.amount.mul(accCheckPerShare).div(1e12).sub(user.rewardDebt);
  }

  // Update reward vairables for all pools. Be careful of gas spending!
  function massUpdatePools() public {
    uint256 length = poolInfo.length;
    for (uint256 pid = 0; pid < length; ++pid) {
      updatePool(pid);
    }
  }

  // Update reward variables of the given pool to be up-to-date.
  function updatePool(uint256 _pid) public  {
    PoolInfo storage pool = poolInfo[_pid];
    if (block.number <= pool.lastRewardBlock) {
      return;
    }
    uint256 lpSupply = pool.lpSupply;
    if (lpSupply == 0) {
      pool.lastRewardBlock = block.number;
      return;
    }
    uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
    uint256 checkReward = multiplier.mul(checkPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
    cake.mint(devaddr, checkReward.div(10));
    cake.mint(address(this), checkReward);
    pool.accCheckPerShare = pool.accCheckPerShare.add(checkReward.mul(1e12).div(lpSupply));
    pool.lastRewardBlock = block.number;
  }

  // Deposit Staking tokens to FairLaunchToken for CHECK allocation.
  function deposit(uint256 _pid, uint256 _amount) public  {
    require(_pid < poolInfo.length, 'pool is not existed');
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    updatePool(_pid);
    if (user.amount > 0) _harvest(_pid);
    IERC20(pool.stakeToken).safeTransferFrom(address(msg.sender), address(this), _amount);
    user.amount = user.amount.add(_amount);
    user.rewardDebt = user.amount.mul(pool.accCheckPerShare).div(1e12);
    pool.lpSupply = pool.lpSupply.add(_amount);
    emit Deposit(msg.sender, _pid, _amount);
  }

  // Withdraw Staking tokens from FairLaunchToken.
  function withdraw(uint256 _pid, uint256 _amount) public  {
    _withdraw(_pid, _amount);
  }

  function withdrawAll(uint256 _pid) public {
    _withdraw(_pid, userInfo[_pid][msg.sender].amount);
  }

  function _withdraw(uint256 _pid, uint256 _amount) internal {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    require(user.amount >= _amount, "withdraw: not good");
    updatePool(_pid);
    _harvest(_pid);
    user.amount = user.amount.sub(_amount);
    user.rewardDebt = user.amount.mul(pool.accCheckPerShare).div(1e12);
    pool.lpSupply = pool.lpSupply.sub(_amount);
    if (pool.stakeToken != address(0)) {
      IERC20(pool.stakeToken).safeTransfer(address(msg.sender), _amount);
    }
    emit Withdraw(msg.sender, _pid, user.amount);
  }

  // Harvest CHECKs earn from the pool.
  function harvest(uint256 _pid) public  {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    updatePool(_pid);
    _harvest(msg.sender, _pid);
    user.rewardDebt = user.amount.mul(pool.accCheckPerShare).div(1e12);
  }

  function _harvest(uint256 _pid) internal {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    require(user.amount > 0, "nothing to harvest");
    uint256 pending = user.amount.mul(pool.accCheckPerShare).div(1e12).sub(user.rewardDebt);
    require(pending <= check.balanceOf(address(this)), "wtf not enough check");
    _safeCheckTransfer(msg.sender, pending);
  }

  // Withdraw without caring about rewards. EMERGENCY ONLY.
  function emergencyWithdraw(uint256 _pid) public {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    IERC20(pool.stakeToken).safeTransfer(address(msg.sender), user.amount);
    user.amount = 0;
    user.rewardDebt = 0;
    emit EmergencyWithdraw(msg.sender, _pid, user.amount);
  }

    // Safe check transfer function, just in case if rounding error causes pool to not have enough CHECKs.
  function _safeCheckTransfer(address _to, uint256 _amount) internal {
    uint256 checkBal = check.balanceOf(address(this));
    if (_amount > checkBal) {
      check.transfer(_to, checkBal);
    } else {
      check.transfer(_to, _amount);
    }
  }

  // Deposit CHECK-TOKEN to CashPool for FPT allocation.
  function depositCheckToCashPool(address _for, uint256 _pid, uint256 _amount) public  {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][_for];
    require(block.number >= pool.startBlock && block.number < pool.endBlock, "The cash-out activity did not start");
    check.safeTransferFrom(address(msg.sender), address(this), _amount);
    user.amount = user.amount.add(_amount);
    pool.stakeTotal = pool.stakeTotal.add(_amount);
    emit DepositCheckToCashPool(msg.sender, _pid, _amount);
  }

  function cashCheck(uint256 _pid) public  {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][msg.sender];
    require(block.number >= pool.startBlock && block.number < pool.endBlock, "The cash-out activity did not start");
    require(user.amount > 0, "nothing to cash");
    uint256 pending = pool.cashTotal.mul(user.amount).div(pool.stakeTotal);
    IERC20 cashToken = IERC20(pool.cashToken);
    require(pending <= cashToken.balanceOf(address(this)), "wtf not enough cashToken");
    require(user.amount <= check.balanceOf(address(this)), "wtf not enough check-token to burn");
    check.burn(address(this), user.amount);
    cashToken.safeTransfer(address(msg.sender), pending);
    emit CashedCheck(msg.sender, _pid, user.amount, pending);
  } 

}
