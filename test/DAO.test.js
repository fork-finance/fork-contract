const truffleAssert = require('truffle-assertions');

const DAOTreasury = artifacts.require('DAOTreasury');
const ForkToken = artifacts.require('ForkToken');
const DevShare = artifacts.require('DevShare');
const Timelock = artifacts.require('Timelock');
const {increaseTime,decreaseTime,latest} = require('./utils/time');
const {BN, expectRevert, time } = require('@openzeppelin/test-helpers');

contract('ForkFarmLaunch', async (accounts) => {
  let dev, alice, bob, minter;
  const { toWei } = web3.utils;
  const { fromWei } = web3.utils;
  const DAY = 60*60*24;

  beforeEach(async () => {
    // swapRouter = await UniswapV2Router02.deployed();
    // swapFactory = await UniswapV2Factory.deployed();
    // tokens

    // users
    [dev, alice, bob, dev, minter] = accounts;

    this.fork = await ForkToken.new(0, 1, {from: dev});
    this.devShare = await DevShare.new(this.fork.address, 100, 300, {from: dev});
    this.dao = await DAOTreasury.new(this.fork.address, {from: dev});
    this.timelock = await Timelock.new(dev, DAY);
    // this.devShare.transferOwnership(this.timelock.address);
    await this.dao.transferOwnership(this.timelock.address, {from: dev});
    await this.fork.mint(this.dao.address,'5000', {from: dev});
    await this.fork.mint(this.devShare.address,'1000', {from: dev});
  })
  describe('when using DevShare', ()=>{
    it("should release", async() => {
      assert.equal((await this.devShare.canUnlockAmount()).toString(), '0');
      await this.devShare.unlock(alice, {from: dev});
      assert.equal((await this.fork.balanceOf(alice)).toString(), '0');
      await time.advanceBlockTo('120');
      // assert.equal((await this.devShare.canUnlockAmount()).toString(), '200', 'err1');
      // await this.devShare.unlock(alice, {from: dev});
      // assert.equal((await this.fork.balanceOf(alice)).toString(), '200', 'err2');
      await time.advanceBlockTo('300');
      assert.equal((await this.devShare.canUnlockAmount()).toString(), '1000');
      await this.devShare.unlock(alice, {from: dev});
      assert.equal((await this.fork.balanceOf(alice)).toString(), '1000');
    })
  })
  describe('when using dao', ()=> {
    it("should transferForkTo with timelock", async()=>{
     
      const EXACT_ETA = (await latest()) + 60*60*24+1;
      const SIZE = '2000';
      const signature = `transferForkTo(address,uint256)`;
      await this.timelock.queueTransaction(
        this.dao.address,
        0,
        signature,
        web3.eth.abi.encodeParameters(['address', 'uint256'],[alice, SIZE]),
        EXACT_ETA,
        {from: dev}
      );
      await increaseTime(24 * 60 * 60+10);
      await this.timelock.executeTransaction(
        this.dao.address,
        0,
        signature,
        web3.eth.abi.encodeParameters(['address', 'uint256'],[alice, SIZE]),
        EXACT_ETA,
        {from: dev}
      );
      assert.equal(await this.fork.balanceOf(this.dao.address), '3000');
      assert.equal(await this.fork.balanceOf(alice), '2000');
    })
  })
});