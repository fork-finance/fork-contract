const Timelock = artifacts.require("Timelock");
const knownContracts = require('./known-contracts.js');

const DAY = 86400;

module.exports = async (deployer, network, accounts) => {
    
    if (!knownContracts.Timelock[network]) {
        await deployer.deploy(Timelock, accounts[0], 1 * DAY);
    }

};