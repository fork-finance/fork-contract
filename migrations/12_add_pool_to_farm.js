const knownContracts = require('./known-contracts');

const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const IERC20 = artifacts.require('IERC20');
const IWBNB = artifacts.require('IWETH');

const ForkFarmLaunch = artifacts.require("IDFO");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  const uniswapRouter = knownContracts.UniswapV2Router02[network] ? await UniswapV2Router02.at(knownContracts.UniswapV2Router02[network]) : await UniswapV2Router02.deployed();
  const uniswapFactory = knownContracts.UniswapV2Factory[network] ? await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]) : await UniswapV2Factory.deployed();
  
  const dai = knownContracts.DAI[network] ? await IERC20.at(knownContracts.DAI[network]) : await MockDai.deployed();
  const wbnb = knownContracts.WBNB[network] ? await IWBNB.at(knownContracts.WBNB[network]) : await MockWBNB.deployed();

  const checkToken = knownContracts.CHECK[network] ? await CheckToken.at(knownContracts.CHECK[network]) : await CheckToken.deployed();
  const forkToken = knownContracts.FORK[network] ? await ForkToken.at(knownContracts.FORK[network]) : await ForkToken.deployed();

  let check_wbnb_pair, check_busd_pair;
  check_wbnb_pair = await uniswapFactory.getPair(checkToken.address, wbnb.address);
  if (check_wbnb_pair == '0x0000000000000000000000000000000000000000') {
    await uniswapFactory.createPair(checkToken.address, wbnb.address);
    check_wbnb_pair = await uniswapFactory.getPair(checkToken.address, wbnb.address);
  }

  check_busd_pair = await uniswapFactory.getPair(checkToken.address, dai.address);
  if (check_busd_pair == '0x0000000000000000000000000000000000000000') {
    await uniswapFactory.createPair(checkToken.address, dai.address);
    check_busd_pair = await uniswapFactory.getPair(checkToken.address, dai.address);
  }

  let fork_wbnb_pair, fork_busd_pair;
  fork_wbnb_pair = await uniswapFactory.getPair(forkToken.address, wbnb.address);
  if (fork_wbnb_pair == '0x0000000000000000000000000000000000000000') {
    await uniswapFactory.createPair(forkToken.address, wbnb.address);
    fork_wbnb_pair = await uniswapFactory.getPair(forkToken.address, wbnb.address);
  }

  fork_busd_pair = await uniswapFactory.getPair(forkToken.address, dai.address);
  if (fork_busd_pair == '0x0000000000000000000000000000000000000000') {
    await uniswapFactory.createPair(forkToken.address, dai.address);
    fork_busd_pair = await uniswapFactory.getPair(forkToken.address, dai.address);
  }

  const pools = [{
    alloc_point: '1000',
    staking_token_addr: fork_wbnb_pair,
    staking_token_name: 'FORK-WBNB-LP'
  },
  // {
  //   alloc_point: '900',
  //   staking_token_addr: fork_busd_pair,
  //   staking_token_name: 'FORK-BUSD-LP'
  // },
  {
    alloc_point: '100',
    staking_token_addr: forkToken.address,
    staking_token_name: 'FORK'
  },
  {
    alloc_point: '1000',
    staking_token_addr: check_wbnb_pair,
    staking_token_name: 'CHECK-WBNB-LP'
  },
  // {
  //   alloc_point: '900',
  //   staking_token_addr: check_busd_pair,
  //   staking_token_name: 'CHECK-BUSD-LP'
  // },
  {
    alloc_point: '100',
    staking_token_addr: checkToken.address,
    staking_token_name: 'CHECK'
  },
  {
    alloc_point: '50',
    staking_token_addr: dai.address,
    staking_token_name: 'BUSD'
  }
  ];
  forkFarm = await ForkFarmLaunch.deployed();
  // updateMultiplier
  for (let i in pools) {
    let p = pools[i];
    await forkFarm.add(0, p.alloc_point, p.staking_token_addr, false);
  }
}
