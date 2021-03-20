const truffleAssert = require('truffle-assertions');

const CheckToken = artifacts.require('CheckToken');
const MockERC20 = artifacts.require('MockERC20');
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

contract('ForkFarmLaunch', async (accounts) => {
  const CHECK_REWARD_PER_BLOCK = web3.utils.toWei('5000', 'ether');
  let deployer, alice, bob, dev;
  const { toWei } = web3.utils;
  const { fromWei } = web3.utils;

  beforeEach(async () => {
    // pancake-swap
    swapRouter = await UniswapV2Router02.deployed();
    swapFactory = await UniswapV2Factory.deployed();
    // tokens
    checkToken = await CheckToken.new();

    // users
    [deployer, alice, bob, dev] = accounts;
    // forkFarmLaunch
    forkFarmLaunch = await ForkFarmLaunch.new(checkToken.address, deployer, CHECK_REWARD_PER_BLOCK);
    await checkToken.transferOwnership(ForkFarmLaunch.address);
    // TODO
    
  })
}