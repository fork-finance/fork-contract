pragma solidity 0.6.6;

interface IForkFarmLaunch {
  function poolLength() external view returns (uint256);

  function setProjectIsImpEnd(uint256 _projectId, bool _isImpEnd) external;

  function setBonus(
    uint256 _projectId,
    uint256 _bonusMultiplier,
    uint256 _bonusEndBlock,
    uint256 _bonusLockUpBps
  ) external;

  function setProject(
    uint256 _projectId,
    string calldata _name,
    uint256 _pubStartBlock,
    uint256 _lauStartBlock,
    uint256 _impStartBlock
  ) external;

  function addProject(
    string calldata _name,
    uint256 _pubStartBlock,
    uint256 _lauStartBlock,
    uint256 _impStartBlock,
    uint256 _bonusMultiplier,
    uint256 _bonusEndBlock,
    uint256 _bonusLockUpBps
  ) external;

  function addPool(
    uint256 _projectId,
    uint256 _allocPoint,
    address _stakeToken,
    bool _withUpdate
  ) external;

  function setPool(
    uint256 _pid,
    uint256 _allocPoint,
    bool _withUpdate
  ) external;

  function addCashPool(
    uint256 _cashTotal,
    address _cashToken,
    uint256 _startBlock,
    uint256 _endBlock
  ) external;

  function setCashPool(
    uint256 _pid,
    uint256 _cashTotal,
    address _cashToken,
    uint256 _startBlock,
    uint256 _endBlock
  ) external;

  function pendingCheck(uint256 _pid, address _user) external view returns (uint256);

  function updatePool(uint256 _pid) external;

  function deposit(address _for, uint256 _pid, uint256 _amount) external;

  function withdraw(address _for, uint256 _pid, uint256 _amount) external;

  function withdrawAll(address _for, uint256 _pid) external;

  function harvest(uint256 _pid) external;

  function depositCheckToCashPool(address _for, uint256 _pid, uint256 _amount) external;

  function cashCheck(uint256 _pid) external;
}