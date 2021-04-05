// ============ Contracts ============

const knownContracts = require('./known-contracts');
// Token
// deployed first
const ForkToken = artifacts.require('ForkToken');

const conf = require("./conf");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  if (!knownContracts.FORK[network] ) {
    const startReleaseBlock = conf.startReleaseBlock[network];
    const endReleaseBlock = conf.endReleaseBlock[network];

    await deployer.deploy(ForkToken, startReleaseBlock, endReleaseBlock);
    const fork = await ForkToken.deployed();
    console.log(`fork address:${fork.address}`)
  }
}
