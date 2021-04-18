const CheckToken = artifacts.require('CheckToken');
const Timelock = artifacts.require("Timelock");

const ForkFarmLaunch = artifacts.require("IDFO");

const conf = require("./conf");
const knownContracts = require('./known-contracts.js');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  const forkFarmLaunch = await ForkFarmLaunch.deployed();
  const checkToken = knownContracts.CHECK[network] ? await CheckToken.at(knownContracts.CHECK[network]) : await CheckToken.deployed();
  await checkToken.transferOwnership(forkFarmLaunch.address);

  const timelock = knownContracts.Timelock[network] ? await Timelock.at(knownContracts.Timelock[network]) : await Timelock.deployed();

  // await forkFarmLaunch.transferOwnership(timelock.address);
}