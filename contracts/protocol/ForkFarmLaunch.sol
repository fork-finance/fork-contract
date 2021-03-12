pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./CheckToken.sol";
import "./interfaces/IForkFarmLaunch.sol";

// ForkLaunch is a smart contract for distributing CHECK by asking user to stake the FORK token.
contract ForkFarmLaunch is IForkFarmLaunch, Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;
  using SafeERC20 for CheckToken;

  // Info of each user.
  struct UserInfo {
    uint256 amount; // How many Staking tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
    uint256 bonusDebt; // Last block that user exec something to the pool.
    address fundedBy; // Funded by who?
    //
    // We do some fancy math here. Basically, any point in time, the amount of CHECKs
    // entitled to a user but is pending to be distributed is:
    //
    //   pending reward = (user.amount * pool.accAlpacaPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws Staking tokens to a pool. Here's what happens:
    //   1. The pool's `accAlpacaPerShare` (and `lastRewardBlock`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.
  }

  // Info of each pool.
  struct PoolInfo {
    address stakeToken; // Address of Staking token contract.
    uint256 allocPoint; // How many allocation points assigned to this pool. CHECKs to distribute per block.
    uint256 lastRewardBlock; // Last block number that CHECKs distribution occurs.
    uint256 accAlpacaPerShare; // Accumulated CHECKs per share, times 1e12. See below.
    uint256 accAlpacaPerShareTilBonusEnd; // Accumated CHECKs per share until Bonus End.
    uint256 projectId;
    uint256 lpSupply;
  }

  struct ProjectInfo {
    string name;
    bool isImpEnd;  // if ==true stop minting
    uint256 pubStartBlock; // Publicity period // if block.number>= start minting
    uint256 lauStartBlock; // Launch period
    uint256 impStartBlock; // Implementation period
    // uint256 referendumLimit;
    // Bonus muliplier for early makers.
    uint256 bonusMultiplier;
    // Block number when bonus CHECK period ends.
    uint256 bonusEndBlock;
    // Bonus lock-up in BPS
    uint256 bonusLockUpBps;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 totalAllocPoint;
  }
  enum ProjectStatus {PENDING, PUBLICIZING, LAUNCHING, IMPLEMENTINT, RUNNING}

  // get status of project
  function _project_status(uint256 _pid) internal view returns(ProjectStatus) {
    ProjectInfo storage project = projectInfo[_pid];
    if (block.number >= project.pubStartBlock && block.number < project.lauStartBlock) {
      return ProjectStatus.PUBLICIZING;
    }
    if (block.number >= project.lauStartBlock && block.number < project.impStartBlock) {
      return ProjectStatus.LAUNCHING;
    }
    if (block.number >= project.impStartBlock && !project.isImpEnd) {
      return ProjectStatus.IMPLEMENTINT;
    }
    if (block.number >= project.impStartBlock && project.isImpEnd) {
      return ProjectStatus.RUNNING;
    }
    return ProjectStatus.PENDING;
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

  // Info of each project.
  ProjectInfo[] public projectInfo;
  // Info of each pool.
  PoolInfo[] public poolInfo;
  // Info of each user that stakes Staking tokens.
  mapping(uint256 => mapping(address => UserInfo)) public userInfo;
  
  // The block number when CHECK mining starts.
  // uint256 public startBlock;

  event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
  event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
  event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
  event DepositCheckToCashPool(address indexed user, uint256 indexed pid, uint256 amount);
  event CashedCheck(address indexed user, uint256 indexed pid, uint256 amount, uint256 pending);

  constructor(
    address _check,
    address _devaddr,
    uint256 _checkPerBlock
    // uint256 _startBlock,
    // uint256 _bonusLockupBps,
    // uint256 _bonusEndBlock
  ) public {
    check = CheckToken(_check);
    devaddr = _devaddr;
    checkPerBlock = _checkPerBlock;
    // bonusLockUpBps = _bonusLockupBps;
    // bonusEndBlock = _bonusEndBlock;
    // startBlock = _startBlock;
  }

  /*
  ██████╗░░█████╗░██████╗░░█████╗░███╗░░░███╗  ░██████╗███████╗████████╗████████╗███████╗██████╗░
  ██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗░████║  ██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
  ██████╔╝███████║██████╔╝███████║██╔████╔██║  ╚█████╗░█████╗░░░░░██║░░░░░░██║░░░█████╗░░██████╔╝
  ██╔═══╝░██╔══██║██╔══██╗██╔══██║██║╚██╔╝██║  ░╚═══██╗██╔══╝░░░░░██║░░░░░░██║░░░██╔══╝░░██╔══██╗
  ██║░░░░░██║░░██║██║░░██║██║░░██║██║░╚═╝░██║  ██████╔╝███████╗░░░██║░░░░░░██║░░░███████╗██║░░██║
  ╚═╝░░░░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░░░░╚═╝  ╚═════╝░╚══════╝░░░╚═╝░░░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝
  */

  // Update dev address by the previous dev.
  function setDev(address _devaddr) public {
    require(msg.sender == devaddr, "dev: wut?");
    devaddr = _devaddr;
  }

  function setAlpacaPerBlock(uint256 _checkPerBlock) public onlyOwner {
    checkPerBlock = _checkPerBlock;
  }

  // Set Bonus params. bonus will start to accu on the next block that this function executed
  // See the calculation and counting in test file.
  function setBonus(
    uint256 _projectId,
    uint256 _bonusMultiplier,
    uint256 _bonusEndBlock,
    uint256 _bonusLockUpBps
  ) public override onlyOwner {
    require(_bonusEndBlock > block.number, "setBonus: bad bonusEndBlock");
    require(_bonusMultiplier > 1, "setBonus: bad bonusMultiplier");
    ProjectInfo storage project = projectInfo[_projectId];
    project.bonusMultiplier = _bonusMultiplier;
    project.bonusEndBlock = _bonusEndBlock;
    project.bonusLockUpBps = _bonusLockUpBps;
  }

  function addProject(
    string memory _name,
    uint256 _pubStartBlock,
    uint256 _lauStartBlock,
    uint256 _impStartBlock,
    uint256 _bonusMultiplier,
    uint256 _bonusEndBlock,
    uint256 _bonusLockUpBps
  ) public override onlyOwner {
    require(_pubStartBlock < _lauStartBlock && _lauStartBlock<_impStartBlock, "error: pubStartBlock > lauStartBlock or _lauStartBlock>_impStartBlock");
    projectInfo.push(
      ProjectInfo({
        name: _name,
        pubStartBlock: _pubStartBlock,
        lauStartBlock: _lauStartBlock,
        impStartBlock: _impStartBlock,
        bonusMultiplier: _bonusMultiplier,
        bonusEndBlock: _bonusEndBlock,
        bonusLockUpBps: _bonusLockUpBps,
        totalAllocPoint: 0,
        isImpEnd: false
      })
    );
  }

  function setProjectIsImpEnd(uint256 _projectId, bool _isImpEnd) public override onlyOwner {
    projectInfo[_projectId].isImpEnd = _isImpEnd;
  }

  function setProject(
    uint256 _projectId,
    string memory _name,
    uint256 _pubStartBlock,
    uint256 _lauStartBlock,
    uint256 _impStartBlock
  ) public override onlyOwner {
    require(_pubStartBlock < _lauStartBlock && _lauStartBlock<_impStartBlock, "error: pubStartBlock > lauStartBlock or _lauStartBlock>_impStartBlock");
    projectInfo[_projectId].name = _name;
    projectInfo[_projectId].pubStartBlock = _pubStartBlock;
    projectInfo[_projectId].lauStartBlock = _lauStartBlock;
    projectInfo[_projectId].impStartBlock = _impStartBlock;
  }

  // Add a new lp to the pool. Can only be called by the owner.
  function addPool(
    uint256 _projectId,
    uint256 _allocPoint,
    address _stakeToken,
    bool _withUpdate
  ) public override onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    require(_stakeToken != address(0), "add: not stakeToken addr");
    // check exisit projectId
    // require(projectInfo[_projectId]), "add: stakeToken dup");
    require(!isDuplicatedPool(_projectId, _stakeToken), "add: stakeToken dup");
    ProjectInfo storage project = projectInfo[_projectId];
    uint256 lastRewardBlock = block.number > project.lauStartBlock ? block.number : project.lauStartBlock;
    project.totalAllocPoint = project.totalAllocPoint.add(_allocPoint);
    poolInfo.push(
      PoolInfo({
        projectId: _projectId,
        stakeToken: _stakeToken,
        allocPoint: _allocPoint,
        lastRewardBlock: lastRewardBlock,
        accAlpacaPerShare: 0,
        accAlpacaPerShareTilBonusEnd: 0,
        lpSupply: 0
      })
    );
  }

  // Update the given pool's CHECK allocation point. Can only be called by the owner.
  function setPool(
    uint256 _pid,
    uint256 _allocPoint,
    bool _withUpdate
  ) public override onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    projectInfo[poolInfo[_pid].projectId].totalAllocPoint = projectInfo[poolInfo[_pid].projectId].totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
    poolInfo[_pid].allocPoint = _allocPoint;
  }

  function addCashPool(
    uint256 _cashTotal,
    address _cashToken,
    uint256 _startBlock,
    uint256 _endBlock
  ) public override onlyOwner {
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
  ) public override onlyOwner {
    require(_cashToken != address(0), "add: not cashToken addr");
    require(_endBlock > _startBlock, "_endBlock < _startBlock");

    cashPoolInfo[_pid].cashTotal = _cashTotal;
    cashPoolInfo[_pid].cashToken = _cashToken;
    cashPoolInfo[_pid].startBlock = _startBlock;
    cashPoolInfo[_pid].endBlock = _endBlock;
  }

  /*
  ░██╗░░░░░░░██╗░█████╗░██████╗░██╗░░██╗
  ░██║░░██╗░░██║██╔══██╗██╔══██╗██║░██╔╝
  ░╚██╗████╗██╔╝██║░░██║██████╔╝█████═╝░
  ░░████╔═████║░██║░░██║██╔══██╗██╔═██╗░
  ░░╚██╔╝░╚██╔╝░╚█████╔╝██║░░██║██║░╚██╗
  ░░░╚═╝░░░╚═╝░░░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝
  */

  function isDuplicatedPool(uint256 _projectId, address _stakeToken) public view returns (bool) {
    uint256 length = poolInfo.length;
    for (uint256 _pid = 0; _pid < length; _pid++) {
      if( poolInfo[_pid].projectId == _projectId && poolInfo[_pid].stakeToken == _stakeToken) return true;
    }
    return false;
  }

  function poolLength() external override view returns (uint256) {
    return poolInfo.length;
  }

  function manualMint(address _to, uint256 _amount) public onlyOwner {
    check.manualMint(_to, _amount);
  }

  // Return reward multiplier over the given _from to _to block.
  function getMultiplier(uint256 _projectId, uint256 _lastRewardBlock, uint256 _currentBlock) public view returns (uint256) {
    uint256 bonusEndBlock = projectInfo[_projectId].bonusEndBlock;
    uint256 bonusMultiplier = projectInfo[_projectId].bonusMultiplier;
    if (_currentBlock <= bonusEndBlock) {
      return _currentBlock.sub(_lastRewardBlock).mul(bonusMultiplier);
    }
    if (_lastRewardBlock >= bonusEndBlock) {
      return _currentBlock.sub(_lastRewardBlock);
    }
    // This is the case where bonusEndBlock is in the middle of _lastRewardBlock and _currentBlock block.
    return bonusEndBlock.sub(_lastRewardBlock).mul(bonusMultiplier).add(_currentBlock.sub(bonusEndBlock));
  }

  // View function to see pending CHECKs on frontend.
  function pendingCheck(uint256 _pid, address _user) external override view returns (uint256) {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_user];
    uint256 accAlpacaPerShare = pool.accAlpacaPerShare;
    // uint256 lpSupply = IERC20(pool.stakeToken).balanceOf(address(this));
    uint256 lpSupply = pool.lpSupply;
    if (block.number > pool.lastRewardBlock && lpSupply != 0) {
      uint256 multiplier = getMultiplier(pool.projectId, pool.lastRewardBlock, block.number);
      uint256 checkReward = multiplier.mul(checkPerBlock).mul(pool.allocPoint).div(projectInfo[pool.projectId].totalAllocPoint);
      accAlpacaPerShare = accAlpacaPerShare.add(checkReward.mul(1e12).div(lpSupply));
    }
    return user.amount.mul(accAlpacaPerShare).div(1e12).sub(user.rewardDebt);
  }

  // Update reward vairables for all pools. Be careful of gas spending!
  function massUpdatePools() public {
    uint256 length = poolInfo.length;
    for (uint256 pid = 0; pid < length; ++pid) {
      updatePool(pid);
    }
  }

  // Update reward variables of the given pool to be up-to-date.
  function updatePool(uint256 _pid) public override {
    PoolInfo storage pool = poolInfo[_pid];
    ProjectInfo storage project = projectInfo[pool.projectId];
    ProjectStatus status = _project_status(pool.projectId);
    if (block.number <= pool.lastRewardBlock) {
      return;
    }
    if (status != ProjectStatus.LAUNCHING && status != ProjectStatus.IMPLEMENTINT) {
      return;
    }
    uint256 lpSupply = pool.lpSupply;
    if (lpSupply == 0) {
      pool.lastRewardBlock = block.number;
      return;
    }
    uint256 multiplier = getMultiplier(pool.projectId, pool.lastRewardBlock, block.number);
    // uint256 totalAllocPoint = project.totalAllocPoint;
    // uint256 bonusEndBlock = project.bonusEndBlock;
    // uint256 bonusMultiplier = project.bonusMultiplier;
    // uint256 bonusLockUpBps = project.bonusLockUpBps;
    uint256 checkReward = multiplier.mul(checkPerBlock).mul(pool.allocPoint).div(project.totalAllocPoint);
    check.mint(devaddr, checkReward.div(10));
    check.mint(address(this), checkReward);
    pool.accAlpacaPerShare = pool.accAlpacaPerShare.add(checkReward.mul(1e12).div(lpSupply));
    // update accAlpacaPerShareTilBonusEnd
    if (block.number <= project.bonusEndBlock) {
      // check.lockWithProject(pool.projectId, devaddr, checkReward.div(10).mul(bonusLockUpBps).div(10000));
      pool.accAlpacaPerShareTilBonusEnd = pool.accAlpacaPerShare;
    }
    if(block.number > project.bonusEndBlock && pool.lastRewardBlock < project.bonusEndBlock) {
      uint256 checkBonusPortion = project.bonusEndBlock.sub(pool.lastRewardBlock).mul(project.bonusMultiplier).mul(checkPerBlock).mul(pool.allocPoint).div(project.totalAllocPoint);
      // check.lockWithProject(pool.projectId, devaddr, checkBonusPortion.div(10).mul(bonusLockUpBps).div(10000));
      pool.accAlpacaPerShareTilBonusEnd = pool.accAlpacaPerShareTilBonusEnd.add(checkBonusPortion.mul(1e12).div(lpSupply));
    }
    pool.lastRewardBlock = block.number;
  }

  // Deposit Staking tokens to FairLaunchToken for CHECK allocation.
  function deposit(address _for, uint256 _pid, uint256 _amount) public override {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_for];
    if (user.fundedBy != address(0)) require(user.fundedBy == msg.sender, "bad sof");
    require(pool.stakeToken != address(0), "deposit: not accept deposit");
    updatePool(_pid);
    if (user.amount > 0) _harvest(_for, _pid);
    if (user.fundedBy == address(0)) user.fundedBy = msg.sender;
    IERC20(pool.stakeToken).safeTransferFrom(address(msg.sender), address(this), _amount);
    user.amount = user.amount.add(_amount);
    user.rewardDebt = user.amount.mul(pool.accAlpacaPerShare).div(1e12);
    user.bonusDebt = user.amount.mul(pool.accAlpacaPerShareTilBonusEnd).div(1e12);
    pool.lpSupply = pool.lpSupply.add(_amount);
    emit Deposit(msg.sender, _pid, _amount);
  }

  // Withdraw Staking tokens from FairLaunchToken.
  function withdraw(address _for, uint256 _pid, uint256 _amount) public override {
    _withdraw(_for, _pid, _amount);
  }

  function withdrawAll(address _for, uint256 _pid) public override {
    _withdraw(_for, _pid, userInfo[_pid][_for].amount);
  }

  function _withdraw(address _for, uint256 _pid, uint256 _amount) internal {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_for];
    require(user.fundedBy == msg.sender, "only funder");
    require(user.amount >= _amount, "withdraw: not good");
    updatePool(_pid);
    _harvest(_for, _pid);
    user.amount = user.amount.sub(_amount);
    user.rewardDebt = user.amount.mul(pool.accAlpacaPerShare).div(1e12);
    user.bonusDebt = user.amount.mul(pool.accAlpacaPerShareTilBonusEnd).div(1e12);
    pool.lpSupply = pool.lpSupply.sub(_amount);
    if (pool.stakeToken != address(0)) {
      IERC20(pool.stakeToken).safeTransfer(address(msg.sender), _amount);
    }
    emit Withdraw(msg.sender, _pid, user.amount);
  }

  // Harvest CHECKs earn from the pool.
  function harvest(uint256 _pid) public override {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    updatePool(_pid);
    _harvest(msg.sender, _pid);
    user.rewardDebt = user.amount.mul(pool.accAlpacaPerShare).div(1e12);
    user.bonusDebt = user.amount.mul(pool.accAlpacaPerShareTilBonusEnd).div(1e12);
  }

  function _harvest(address _to, uint256 _pid) internal {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_to];
    // uint256 bonusLockUpBps = projectInfo[pool.projectId].bonusLockUpBps;
    require(user.amount > 0, "nothing to harvest");
    uint256 pending = user.amount.mul(pool.accAlpacaPerShare).div(1e12).sub(user.rewardDebt);
    require(pending <= check.balanceOf(address(this)), "wtf not enough check");
    // uint256 bonus = user.amount.mul(pool.accAlpacaPerShareTilBonusEnd).div(1e12).sub(user.bonusDebt);
    safeAlpacaTransfer(_to, pending);
    // check.lockWithProject(pool.projectId, _to, bonus.mul(bonusLockUpBps).div(10000));
  }

  // Withdraw without caring about rewards. EMERGENCY ONLY.
  function emergencyWithdraw(uint256 _pid) public {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    IERC20(pool.stakeToken).safeTransfer(address(msg.sender), user.amount);
    emit EmergencyWithdraw(msg.sender, _pid, user.amount);
    user.amount = 0;
    user.rewardDebt = 0;
  }

    // Safe check transfer function, just in case if rounding error causes pool to not have enough CHECKs.
  function safeAlpacaTransfer(address _to, uint256 _amount) internal {
    uint256 checkBal = check.balanceOf(address(this));
    if (_amount > checkBal) {
      check.transfer(_to, checkBal);
    } else {
      check.transfer(_to, _amount);
    }
  }

  // Deposit CHECK-TOKEN to CashPool for FPT allocation.
  function depositCheckToCashPool(address _for, uint256 _pid, uint256 _amount) public override {
    CashPoolInfo storage pool = cashPoolInfo[_pid];
    CashUserInfo storage user = cashUserInfo[_pid][_for];
    require(block.number >= pool.startBlock && block.number < pool.endBlock, "The cash-out activity did not start");
    check.safeTransferFrom(address(msg.sender), address(this), _amount);
    user.amount = user.amount.add(_amount);
    pool.stakeTotal = pool.stakeTotal.add(_amount);
    emit DepositCheckToCashPool(msg.sender, _pid, _amount);
  }

  function cashCheck(uint256 _pid) public override {
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
