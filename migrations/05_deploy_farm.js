const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');

const FairLaunch = artifacts.require("FairLaunch");
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");

const conf = require("./conf");
const knownContracts = require('./known-contracts.js');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  const FORK_REWARD_PER_BLOCK = web3.utils.toWei(conf.FORK_REWARD_PER_BLOCK_ETHER[network], 'ether');
  const CHECK_REWARD_PER_BLOCK = web3.utils.toWei(conf.CHECK_REWARD_PER_BLOCK_ETHER[network], 'ether');
  const BONUS_MULTIPLIER = conf.BONUS_MULTIPLIER[network];
  const BONUS_END_BLOCK = conf.BONUS_END_BLOCK[network];
  const BONUS_LOCK_BPS = conf.BONUS_LOCK_BPS[network];
  const START_BLOCK = conf.START_BLOCK[network];

  // const checkToken= await CheckToken.deployed();

  const forkToken = knownContracts.FORK[network] ? await ForkToken.at(knownContracts.FORK[network]) : await ForkToken.deployed();
  const checkToken = knownContracts.CHECK[network] ? await CheckToken.at(knownContracts.CHECK[network]) : await CheckToken.deployed();

  console.log(">> 1. Deploying FairLaunch");
  await deployer.deploy(FairLaunch, forkToken.address, accounts[0], FORK_REWARD_PER_BLOCK, START_BLOCK, 0, 0);
  console.log("✅ Done");

  const fairLaunch = await FairLaunch.deployed();
  console.log(">> 1.1 Transferring ownership of ForkToken from deployer to FairLaunch");
  await forkToken.transferOwnership(fairLaunch.address);
  console.log("✅ Done");

  console.log(`>> 1.2 Set Fair Launch bonus to BONUS_MULTIPLIER: "${BONUS_MULTIPLIER}", BONUS_END_BLOCK: "${BONUS_END_BLOCK}", LOCK_BPS: ${BONUS_LOCK_BPS}`)
  await fairLaunch.setBonus(BONUS_MULTIPLIER, BONUS_END_BLOCK, BONUS_LOCK_BPS)
  console.log("✅ Done");

  console.log(">> 2. Deploying ForkFarmLaunch");
  await deployer.deploy(ForkFarmLaunch, checkToken.address, accounts[0], CHECK_REWARD_PER_BLOCK);
  console.log("✅ Done");

  const forkFarmLaunch = await ForkFarmLaunch.deployed();
  console.log(">> 2.1 Transferring ownership of checkToken from deployer to ForkFarmLaunch");
  await checkToken.transferOwnership(forkFarmLaunch.address);
  console.log("✅ Done");

};