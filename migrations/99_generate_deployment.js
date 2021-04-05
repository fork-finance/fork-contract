const fs = require('fs');
const path = require('path');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const knownContracts = require('./known-contracts');

const ForkToken = artifacts.require('ForkToken');
const CheckToken = artifacts.require('CheckToken');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const ERC20 = artifacts.require('ERC20');
const IERC20 = artifacts.require('IERC20');
const IWBNB = artifacts.require('IWETH');

const FairLaunch = artifacts.require("FairLaunch");
const ForkFarmLaunch = artifacts.require("ForkFarmLaunch");
const IFairLaunch = artifacts.require("IFairLaunch");
const IForkFarmLaunch = artifacts.require("IForkFarmLaunch");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

// const {ALPACA_REWARD_PER_BLOCK, START_BLOCK} = require('./pool');

module.exports = async (deployer, network, accounts) => {
  let deployments;
  console.log(">> Creating the deployment file");
  const uniswapFactory = network === 'mainnet' ? await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]) : await UniswapV2Factory.deployed();
  const uniswapRouter = network === 'mainnet' ? await UniswapV2Router02.at(knownContracts.UniswapV2Router02[network]) : await UniswapV2Router02.deployed();
  const dai = network === 'mainnet' ? await IERC20.at(knownContracts.DAI[network]) : await MockDai.deployed();
  const wbnb = network === 'mainnet' ? await IWBNB.at(knownContracts.WBNB[network]) : await MockWBNB.deployed();
  const fairLaunch = await FairLaunch.deployed();
  const forkFarmLaunch = await ForkFarmLaunch.deployed();

  deployments = {
    FairLaunch: {
      address: fairLaunch.address,
      pools: await getFairLaunchPools(fairLaunch)
    },
    ForkFarmLaunch: {
      address: forkFarmLaunch.address,
      pools: await getForkFarmLaunchPools(forkFarmLaunch)
    },
    Exchanges: {
      Pancakeswap: {
        UniswapV2Factory: uniswapFactory.address,
        UniswapV2Router02: uniswapRouter.address
      }
    },
    Tokens: {
      WBNB: wbnb.address,
      BUSD: dai.address,
      FORK: ForkToken.address,
      CHECK: CheckToken.address,
    }
  };


  const deploymentPath = path.resolve(__dirname, `../build/deployments.${network}.json`);
  await writeFile(deploymentPath, JSON.stringify(deployments, null, 2));

  console.log(`Exported deployments into ${deploymentPath}`);

  let contracts = [CheckToken, ForkToken, IERC20, IFairLaunch, IForkFarmLaunch, MockDai, MockWBNB, UniswapV2Factory, UniswapV2Router02];

  const abiPath = path.resolve(__dirname, `../build/abis/${network}`);
  
  for (let c of contracts) {
    let abiFile = `${abiPath}/${c.contractName}.json`;
    await writeFile(abiFile, JSON.stringify(c.abi, null, 2));
    console.log(`Exported ${c.contractName}‘s abi into ${abiFile}`);
  }

}


const getFairLaunchPools = async (fairLaunch) => {
  let pools = [];
  const length = await fairLaunch.poolLength();
  for (let pid = 0; pid < length; pid++) {
    let poolInfo = await fairLaunch.poolInfo(pid);
    let token = await ERC20.at(poolInfo.stakeToken);
    let stakeToken = await token.symbol();
    pools.push({
      id: pid,
      stakingToken: stakeToken,
      address: poolInfo.stakeToken,
      allocPoint: poolInfo.allocPoint.toString()
    });
  }
  return pools;
}

const getForkFarmLaunchPools = async (fairLaunch) => {
  let pools = [];
  const length = await fairLaunch.poolLength();
  for (let pid = 0; pid < length; pid++) {
    let poolInfo = await fairLaunch.poolInfo(pid);
    let token = await ERC20.at(poolInfo.stakeToken);
    let stakeToken = await token.symbol();
    console.log('allocPoint', poolInfo.allocPoint.toString())
    pools.push({
      id: pid,
      stakingToken: stakeToken,
      address: poolInfo.stakeToken,
      allocPoint: poolInfo.allocPoint.toString()
    });
  }
  return pools;
}

