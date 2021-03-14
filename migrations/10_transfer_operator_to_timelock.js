const Timelock = artifacts.require("Timelock");
const iBNB = artifacts.require('iBNB');
const iBUSD = artifacts.require('iBUSD');
const FairLaunch = artifacts.require("FairLaunch");
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");

module.exports = async (deployer, network, accounts) => {
    // iBUSD iBNB FairLaunch ForkFarmLaunch 
    const ibnb = await iBNB.deployed();
    const ibusd = await iBUSD.deployed();
    const fairLaunch = await FairLaunch.deployed();
    const forkFarmLaunch = await ForkFarmLaunch.deployed();

    for await (const contract of [ ibnb, ibusd, fairLaunch, forkFarmLaunch]) {
        await contract.transferOwnership(Timelock.address);
    }
};

// tokens
// farms
// add lp
// add pool
// add project
// 权限转移到timelock