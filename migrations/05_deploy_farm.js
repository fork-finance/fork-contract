const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const iBNB = artifacts.require('iBNB');
const iBUSD = artifacts.require('iBUSD');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');

const FairLaunch = artifacts.require("FairLaunch");
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  const FORK_REWARD_PER_BLOCK = web3.utils.toWei('20', 'ether');
  const CHECK_REWARD_PER_BLOCK = web3.utils.toWei('20', 'ether');
  const BONUS_MULTIPLIER = 7;
  const BONUS_END_BLOCK = '5661200';
  const BONUS_LOCK_BPS = '7000';
  const START_BLOCK = '5258000';

  const forkToken = await ForkToken.deployed();
  const checkToken= await CheckToken.deployed();
  const ibnb = await iBNB.deployed();
  const ibusd = await iBUSD.deployed();

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