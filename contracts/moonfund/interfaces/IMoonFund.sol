pragma solidity 0.6.6;

interface IMoonFund {
  function poolLength() external view returns (uint256);

  function addCashPool(uint256 _point, uint256 _startTime) external;

  function pendingCash(uint256 _pid, address _user) external view returns (uint256);
  
  function cash(uint256 _pid, uint256 _amount) external;

  function deposit(uint256 _amount) payable external;
}