const DAY = 60*60*24;
const WEEK = DAY*7;


module.exports = {
  START_BLOCK: {
    ganache: 0,
    testnet: 7057033,
    mainnet: 5258000
  },
  BONUS_END_BLOCK: {
    ganache: 1000,
    testnet: 7057033 + 2*WEEK/5,
    mainnet: 0
  },
  BONUS_LOCK_BPS: {
    ganache: 7000,
    testnet: 7000,
    mainnet: 7000
  },
  BONUS_MULTIPLIER:{
    ganache: 7,
    testnet: 7,
    mainnet: 7
  },
  FORK_REWARD_PER_BLOCK_ETHER: {
    ganache: '20',
    testnet: '20',
    mainnet: '20',
  },
  CHECK_REWARD_PER_BLOCK_ETHER: {
    ganache: '20',
    testnet: '20',
    mainnet: '20',
  },
  startReleaseBlock: {
    ganache: 0,
    testnet: 7057033 + 7*DAY/5,
    mainnet: 6499649,
  },
  endReleaseBlock: {
    ganache: 10,
    testnet: 7057033 + 8*DAY/5,
    mainnet: 6699649,
  }
}
