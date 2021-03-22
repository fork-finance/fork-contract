const knownContracts = require('./known-contracts');

const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const iBNB = artifacts.require('iBNB');
const iBUSD = artifacts.require('iBUSD');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const IERC20 = artifacts.require('IERC20');
const IWBNB = artifacts.require('IWETH');

const FairLaunch = artifacts.require("FairLaunch");
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {

  const uniswapFactory = network === 'mainnet' ? await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]) : await UniswapV2Factory.deployed();
  const uniswapRouter = network === 'mainnet' ? await UniswapV2Router02.at(knownContracts.UniswapV2Router02[network]) : await UniswapV2Router02.deployed();
  const dai = network === 'mainnet' ? await IERC20.at(knownContracts.DAI[network]) : await MockDai.deployed();
  const wbnb = network === 'mainnet' ? await IWBNB.at(knownContracts.WBNB[network]) : await MockWBNB.deployed();

  let fork_wbnb_pair, fork_busd_pair;
  fork_wbnb_pair = await uniswapFactory.getPair(ForkToken.address, wbnb.address);
  if (!web3.utils.hexToString(fork_wbnb_pair)) {
    await uniswapFactory.createPair(ForkToken.address, wbnb.address);
    fork_wbnb_pair = await uniswapFactory.getPair(ForkToken.address, wbnb.address);
  }

  fork_busd_pair = await uniswapFactory.getPair(ForkToken.address, dai.address);
  if (!web3.utils.hexToString(fork_busd_pair)) {
    await uniswapFactory.createPair(ForkToken.address, dai.address);
    fork_busd_pair = await uniswapFactory.getPair(ForkToken.address, dai.address);
  }

  const fairLaunch = await FairLaunch.deployed();
  const fork_pools = [{
    alloc_point: '100',
    staking_token_addr: fork_wbnb_pair,
    staking_token_name: 'FORK-WBNB-LP'
  },{
    alloc_point: '100',
    staking_token_addr: fork_busd_pair,
    staking_token_name: 'FORK-BUSD-LP'
  },{
    alloc_point: '100',
    staking_token_addr: ForkToken.address,
    staking_token_name: 'FORK'
  }];
  for (let i in fork_pools) {
    let p = fork_pools[i];
    await fairLaunch.addPool(p.alloc_point, p.staking_token_addr, false);
  }
}
