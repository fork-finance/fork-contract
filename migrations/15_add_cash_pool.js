const knownContracts = require('./known-contracts');

const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const IERC20 = artifacts.require('IERC20');
const IWBNB = artifacts.require('IWETH');

const ForkFarmLaunch = artifacts.require("IDFO");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  const checkToken = knownContracts.CHECK[network] ? await CheckToken.at(knownContracts.CHECK[network]) : await CheckToken.deployed();
  const forkToken = knownContracts.FORK[network] ? await ForkToken.at(knownContracts.FORK[network]) : await ForkToken.deployed();

  const pools = [
  {
    total: web3.utils.toWei('10000', 'ether'),
    token: forkToken.address,
    startTime: parseInt((new Date("2021-04-20 12:00:00 UTC")).getTime()/1000),
    endTime: parseInt((new Date("2021-04-21 12:00:00 UTC")).getTime()/1000),
    projectId: 0
  },
  {
    total: web3.utils.toWei('20000', 'ether'),
    token: forkToken.address,
    startTime: parseInt((new Date("2021-04-18 12:00:00 UTC")).getTime()/1000),
    endTime: parseInt((new Date("2021-04-19 12:00:00 UTC")).getTime()/1000),
    projectId: 0
  },
  {
    total: web3.utils.toWei('30000', 'ether'),
    token: forkToken.address,
    startTime: parseInt((new Date("2021-04-19 12:00:00 UTC")).getTime()/1000),
    endTime: parseInt((new Date("2021-04-20 12:00:00 UTC")).getTime()/1000),
    projectId: 0
  },
  {
    total: web3.utils.toWei('40000', 'ether'),
    token: forkToken.address,
    startTime: parseInt((new Date("2021-04-20 12:00:00 UTC")).getTime()/1000),
    endTime: parseInt((new Date("2021-04-24 12:00:00 UTC")).getTime()/1000),
    projectId: 0
  }
  ];
  forkFarm = await ForkFarmLaunch.deployed();
  // updateMultiplier
  for (let i in pools) {
    let p = pools[i];
    await forkFarm.addCashPool(p.total, p.token, p.startTime, p.endTime, p.projectId);
  }
}
