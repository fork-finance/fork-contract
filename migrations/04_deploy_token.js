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

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  const startReleaseBlock = 6499649;
  const endReleaseBlock = 6699649;

  await deployer.deploy(ForkToken, startReleaseBlock, endReleaseBlock);
  await deployer.deploy(CheckToken);

  if (network !== 'mainnet') {
    await deployer.deploy(MockDai);
    await deployer.deploy(MockWBNB);
  }

  const dai = network === 'mainnet' ? await IERC20.at(knownContracts.DAI[network]) : await MockDai.deployed();
  const wbnb = network === 'mainnet' ? await IWBNB.at(knownContracts.WBNB[network]) : await MockWBNB.deployed();

  await deployer.deploy(WNativeRelayer, wbnb.address);

  wNativeRelayer = await WNativeRelayer.deployed();

  await deployer.deploy(iBNB, wbnb.address, wNativeRelayer.address);
  await deployer.deploy(iBUSD, dai.address);

  ibnb = await iBNB.deployed();

  // set whitelistedCallers
  await wNativeRelayer.setCallerOk([ibnb.address], true);
}
