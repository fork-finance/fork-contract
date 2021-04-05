const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');
const MockWBNB = artifacts.require('MockWBNB');
const IWBNB = artifacts.require('IWETH');
const knownContracts = require('./known-contracts.js');

module.exports = async (deployer, network, accounts) => {
  if (network != 'mainnet') {
    let wbnb;
    if (!knownContracts.WBNB[network] ) {
      await deployer.deploy(MockWBNB);
      wbnb = await MockWBNB.deployed();
    } else {
      wbnb = await IWBNB.at(knownContracts.WBNB[network]);
    }
    if (!knownContracts.UniswapV2Router02[network]) {
      console.log('Deploying pancakeswap on '+network+' network.');
      await deployer.deploy(UniswapV2Factory, accounts[0]);
      const uniswapFactory = await UniswapV2Factory.deployed();
      await deployer.deploy(UniswapV2Router02, uniswapFactory.address, wbnb.address);
    }
  }

};