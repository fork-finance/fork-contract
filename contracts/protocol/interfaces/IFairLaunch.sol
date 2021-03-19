pragma solidity 0.6.6;

interface IFairLaunch {
  function poolLength() external view returns (uint256);

  function addPool(
    uint256 _allocPoint,
    address _stakeToken,
    bool _withUpdate
  ) external;

  function setPool(
    uint256 _pid,
    uint256 _allocPoint,
    bool _withUpdate
  ) external;

  function pendingFork(uint256 _pid, address _user) external view returns (uint256);

  function updatePool(uint256 _pid) external;

  function deposit(uint256 _pid, uint256 _amount) external;

  function withdraw(uint256 _pid, uint256 _amount) external;

  function withdrawAll(uint256 _pid) external;

  function harvest(uint256 _pid) external;
}