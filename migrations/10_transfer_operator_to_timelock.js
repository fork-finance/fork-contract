const Timelock = artifacts.require("Timelock");
const FairLaunch = artifacts.require("FairLaunch");
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");
const knownContracts = require('./known-contracts.js');

module.exports = async (deployer, network, accounts) => {
    // iBUSD iBNB FairLaunch ForkFarmLaunch 
    const timelock = knownContracts.Timelock[network] ? await Timelock.at(knownContracts.Timelock[network]) : await Timelock.deployed();

    const fairLaunch = await FairLaunch.deployed();
    const forkFarmLaunch = await ForkFarmLaunch.deployed();

    for await (const contract of [fairLaunch, forkFarmLaunch]) {
        await contract.transferOwnership(Timelock.address);
    }
};