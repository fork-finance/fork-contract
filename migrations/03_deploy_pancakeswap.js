const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

module.exports = async (deployer, network, accounts) => {
    if (network != 'mainnet') {
        console.log('Deploying pancakeswap on dev network.');
        await deployer.deploy(UniswapV2Factory, accounts[0]);
        const uniswapFactory = await UniswapV2Factory.deployed();
        await deployer.deploy(UniswapV2Router02, uniswapFactory.address, accounts[0]);
    }
    
};