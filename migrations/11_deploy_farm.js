const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');

const IDFO = artifacts.require("IDFO");

const conf = require("./conf");
const knownContracts = require('./known-contracts.js');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  // return;
  const CHECK_REWARD_PER_BLOCK = web3.utils.toWei(conf.CHECK_REWARD_PER_BLOCK_ETHER[network], 'ether');
  const CHECK_START_BLOCK = conf.CHECK_START_BLOCK[network];
  const BONUS_MULTIPLIER = conf.CHECK_BONUS_MULTIPLIER[network];
  const BONUS_END_BLOCK = conf.CHECK_BONUS_END_BLOCK[network];
  const BONUS_LOCK_BPS = conf.CHECK_BONUS_LOCK_BPS[network];

  const checkToken = knownContracts.CHECK[network] ? await CheckToken.at(knownContracts.CHECK[network]) : await CheckToken.deployed();

  console.log(">> 1. Deploying IDFO");
  await deployer.deploy(IDFO, checkToken.address, accounts[0], CHECK_REWARD_PER_BLOCK, CHECK_START_BLOCK, 0, 0);
  console.log("✅ Done");

  const farm = await IDFO.deployed();
  
  console.log(`>> 1.1 Set IDFO bonus to BONUS_MULTIPLIER: "${BONUS_MULTIPLIER}", BONUS_END_BLOCK: "${BONUS_END_BLOCK}", LOCK_BPS: ${BONUS_LOCK_BPS}`)
  await farm.setBonus(BONUS_MULTIPLIER, BONUS_END_BLOCK, BONUS_LOCK_BPS)
  console.log("✅ Done");
};