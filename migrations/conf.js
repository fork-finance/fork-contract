const DAY = 60*60*24;
const WEEK = DAY*7;


module.exports = {
  START_BLOCK: {
    develop: 0,
    ganache: 0,
    testnet: 7057033,
    mainnet: 5258000
  },
  BONUS_END_BLOCK: {
    develop: 1000,
    ganache: 1000,
    testnet: 7057033 + 2*WEEK/5,
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
    mainnet: 7
  },
  FORK_REWARD_PER_BLOCK_ETHER: {
    develop: '20',
    ganache: '20',
    testnet: '20',
    mainnet: '20',
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
    testnet: 7057033 + 7*DAY/5,
    mainnet: 6499649,
  },
  endReleaseBlock: {
    develop: 10,
    ganache: 10,
    testnet: 7057033 + 8*DAY/5,
    mainnet: 6699649,
  }
}
