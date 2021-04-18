const CheckToken = artifacts.require('CheckToken');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const IERC20 = artifacts.require('IERC20');
const IWBNB = artifacts.require('IWETH');

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');
const knownContracts = require('./known-contracts.js');

module.exports = async (deployer, network, accounts) => {
  const { toWei } = web3.utils;
  const uniswapRouter = knownContracts.UniswapV2Router02[network] ? await UniswapV2Router02.at(knownContracts.UniswapV2Router02[network]) : await UniswapV2Router02.deployed();
  const uniswapFactory = knownContracts.UniswapV2Factory[network] ? await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]) : await UniswapV2Factory.deployed();
  const dai = knownContracts.DAI[network] ? await MockDai.at(knownContracts.DAI[network]) : await MockDai.deployed();
  const wbnb = knownContracts.WBNB[network] ? await IWBNB.at(knownContracts.WBNB[network]) : await MockWBNB.deployed();
  const checkToken = knownContracts.CHECK[network] ? await CheckToken.at(knownContracts.CHECK[network]) : await CheckToken.deployed();

  let check_wbnb_pair;

  const amount = toWei('250000', 'ether');
  const amountMin = toWei('250000', 'ether');
  let amountETHMin;
  if (network == 'mainnet') {
    amountETHMin = toWei('5', 'ether');
  } else {
    amountETHMin = toWei('2', 'ether');
  }
  await Promise.all([
    approveIfNot(checkToken, accounts[0], uniswapRouter.address, amount),
    ]);

  await uniswapRouter.addLiquidityETH(
    checkToken.address, amount, amountMin, amountETHMin, accounts[0], deadline(), {from: accounts[0], value: amountETHMin},
    );

  // BUSD
  // 4800
  // if (network != 'mainnet') {
  //   await dai.mint(accounts[0], toWei('4800'), {from: accounts[0]});
  // }
  // const amountBUSD = toWei('4800', 'ether');
  // const amountBUSDMin = toWei('4800', 'ether');
  // await Promise.all([
  //   approveIfNot(checkToken, accounts[0], uniswapRouter.address, amount),
  //   approveIfNot(dai, accounts[0], uniswapRouter.address, amount),
  //   ]);
  // await uniswapRouter.addLiquidity(
  //   checkToken.address, dai.address, amount, amountBUSD, amountMin, amountBUSDMin, accounts[0],  deadline(),
  // );

  // 0x000000000000000000000000000000000000dEaD
  check_wbnb_pair = await uniswapFactory.getPair(checkToken.address, wbnb.address);
  const lp1 = await IERC20.at(check_wbnb_pair);
  let bal_lp1 = await lp1.balanceOf(accounts[0]);
  console.log('addLiquidity:', bal_lp1.toString());
  const burnAddr = '0x000000000000000000000000000000000000dEaD';
  if (bal_lp1>0) {
    if (network != 'mainnet') {
      bal_lp1 = toWei('1', 'ether');
    }
    await lp1.transfer(burnAddr, bal_lp1, {from: accounts[0]});
  }
  console.log('after burn:', (await lp1.balanceOf(accounts[0])).toString());
};

async function approveIfNot(token, owner, spender, amount) {
  const allowance = await token.allowance(owner, spender);
  if (web3.utils.toBN(allowance).gte(web3.utils.toBN(amount))) {
    return;
  }
  await token.approve(spender, amount);
}

function deadline() {
  // 30 minutes
  return Math.floor(new Date().getTime() / 1000) + 1800;
}
