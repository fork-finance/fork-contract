// ============ Contracts ============

const knownContracts = require('./known-contracts');
// Token
// deployed first
const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const iBNB = artifacts.require('iBNB');
const iBUSD = artifacts.require('iBUSD');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const IWBNB = artifacts.require('IWETH');

const WNativeRelayer = artifacts.require('WNativeRelayer');

const conf = require("./conf");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  const startReleaseBlock = conf.startReleaseBlock[network];
  const endReleaseBlock = conf.endReleaseBlock[network];

  await deployer.deploy(ForkToken, startReleaseBlock, endReleaseBlock);
  await deployer.deploy(CheckToken);

  if (network !== 'mainnet') {
    await deployer.deploy(MockDai);
  }

  // const dai = network === 'mainnet' ? await IERC20.at(knownContracts.DAI[network]) : await MockDai.deployed();
  // const wbnb = network === 'mainnet' ? await IWBNB.at(knownContracts.WBNB[network]) : await MockWBNB.deployed();

  // await deployer.deploy(WNativeRelayer, wbnb.address);

  // wNativeRelayer = await WNativeRelayer.deployed();

  // await deployer.deploy(iBNB, wbnb.address, wNativeRelayer.address);
  // await deployer.deploy(iBUSD, dai.address);

  // ibnb = await iBNB.deployed();

  // set whitelistedCallers
  // await wNativeRelayer.setCallerOk([ibnb.address], true);
}
