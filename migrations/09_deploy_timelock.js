const Timelock = artifacts.require("Timelock");

const DAY = 86400;

module.exports = async (deployer, network, accounts) => {
    
    await deployer.deploy(Timelock, accounts[0], 1 * DAY);

};

// tokens
// farms
// add lp
// add pool
// add project
// 权限转移到timelock