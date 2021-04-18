const DAY = 60*60*24;
const WEEK = DAY*7;


module.exports = {
  START_BLOCK: {
    develop: 0,
    ganache: 0,
    testnet: 7762143,
    mainnet: 5258000
  },
  BONUS_END_BLOCK: {
    develop: 1000,
    ganache: 1000,
    testnet: 7762143 + 2*WEEK/3,
    mainnet: 0
  },
  BONUS_LOCK_BPS: {
    develop: 7000,
    ganache: 7000,
    testnet: 7000,
    mainnet: 7000
  },
  BONUS_MULTIPLIER:{
    develop: 7,
    ganache: 7,
    testnet: 7,
    mainnet: 8
  },
  FORK_REWARD_PER_BLOCK_ETHER: {
    develop: '2',
    ganache: '2',
    testnet: '2',
    mainnet: '2',
  },
  CHECK_REWARD_PER_BLOCK_ETHER: {
    develop: '20',
    ganache: '20',
    testnet: '20',
    mainnet: '20',
  },
  startReleaseBlock: {
    develop: 0,
    ganache: 0,
    testnet: 7762143 + 30*DAY/3,
    mainnet: 0,
  },
  endReleaseBlock: {
    develop: 10,
    ganache: 10,
    testnet: 7762143 + 37*DAY/3,
    mainnet: 0,
  },
  CHECK_START_BLOCK: {
    develop: 0,
    ganache: 0,
    testnet: 7774736,
    mainnet: 0,
  },
  CHECK_BONUS_END_BLOCK: {
    develop: 1000,
    ganache: 1000,
    testnet: 7762143 + 2*WEEK/3,
    mainnet: 0
  },
  CHECK_BONUS_LOCK_BPS: {
    develop: 7000,
    ganache: 7000,
    testnet: 7000,
    mainnet: 7000
  },
  CHECK_BONUS_MULTIPLIER:{
    develop: 8,
    ganache: 8,
    testnet: 8,
    mainnet: 8
  },
}
