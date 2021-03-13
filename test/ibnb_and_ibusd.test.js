const truffleAssert = require('truffle-assertions');

const ForkToken = artifacts.require('ForkToken');
const iBNB = artifacts.require('iBNB');
const iBUSD = artifacts.require('iBUSD');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const WNativeRelayer = artifacts.require('WNativeRelayer');


// deposit  withdraw
contract('iBUSD and iBNB', async (accounts) => {
  let deployer, alice, bob, dev;
  const { toWei } = web3.utils;
  const { fromWei } = web3.utils;

  let dai, wbnb, ibusd, ibnb, xxx;

  beforeEach(async () => {
    // tokens
    dai = await MockDai.new();
    wbnb = await MockWBNB.new();
    ibusd = await iBUSD.new(dai.address);
    wNativeRelayer = await WNativeRelayer.new(wbnb.address);
    ibnb = await iBNB.new(wbnb.address, wNativeRelayer.address);
    // set whitelistedCallers
    await wNativeRelayer.setCallerOk([ibnb.address], true);
    // users
    [deployer, alice, bob, dev] = accounts;
  });

  describe('when use iBUSD', () => {
    it('shold deposit dai to get iBUSD', async () => {
      // 1. Mint dai for depositing
      await dai.mint(alice, toWei('100', 'ether'), {from: deployer});
      // 2. Deposit
      await dai.approve(ibusd.address, toWei('80', 'ether'), {from: alice});
      await ibusd.deposit(toWei('80', 'ether'), {from: alice});

      assert.equal(toWei('20', 'ether'), (await dai.balanceOf(alice)).toString());
      assert.equal(toWei('80', 'ether'), (await ibusd.balanceOf(alice)).toString());
      assert.equal(toWei('80', 'ether'), (await dai.balanceOf(ibusd.address)).toString());
    });

    it('shold withdraw iBUSD to get dai', async () => {
      // 1. Mint dai for depositing
      await dai.mint(alice, toWei('100', 'ether'), {from: deployer});
      // 2. Deposit
      await dai.approve(ibusd.address, toWei('100', 'ether'), {from: alice});
      await ibusd.deposit(toWei('100', 'ether'), {from: alice});
      // 4. Withdraw
      await ibusd.withdraw(toWei('60', 'ether'), {from: alice});

      assert.equal(toWei('60', 'ether'), (await dai.balanceOf(alice)).toString());
      assert.equal(toWei('40', 'ether'), (await ibusd.balanceOf(alice)).toString());
      assert.equal(toWei('40', 'ether'), (await dai.balanceOf(ibusd.address)).toString());
    });

    it('shold revert when deposit amount is more than banlance', async () => {
      // 1. Mint dai for depositing
      await dai.mint(alice, toWei('100', 'ether'), {from: deployer});
      // 2. Deposit dai to get iBUSD
      await dai.approve(ibusd.address, toWei('500', 'ether'), {from: alice});
      await truffleAssert.fails(ibusd.deposit(toWei('500', 'ether'), {from: alice}));
    });

    it('shold revert when withdrawal amount is greater than deposit', async () => {
      // 1. Mint dai for depositing
      await dai.mint(alice, toWei('100', 'ether'), {from: deployer});
      // 2. Deposit dai to get iBUSD
      await dai.approve(ibusd.address, toWei('100', 'ether'), {from: alice});
      await ibusd.deposit(toWei('100', 'ether'), {from: alice});

      await truffleAssert.fails(ibusd.withdraw(toWei('500', 'ether'), {from: alice}));
    });
  });

  describe('when use iBNB', () => {
    it('shold revert when deposit amount is not equal value', async () => {
      // 1. Deposit
      await truffleAssert.fails(ibnb.deposit(toWei('80', 'ether'), {from: alice, value: toWei('10', 'ether')}), null, "amount != msg.value");
    });
    it('shold deposit bnb to get iBNB', async () => {
      // 1. Deposit
      await ibnb.deposit(toWei('2', 'ether'), {from: alice, value: toWei('2', 'ether')});

      assert.equal(toWei('2', 'ether'), (await ibnb.balanceOf(alice)).toString());
      assert.equal(toWei('2', 'ether'), (await wbnb.balanceOf(ibnb.address)).toString());
    });

    it('shold withdraw from wbnb to get bnb', async () => {
      // 1. Deposit
      await wbnb.deposit({from: bob, value: toWei('3', 'ether')});
      assert.equal(toWei('3', 'ether'), (await wbnb.balanceOf(bob)).toString());
      // 2. Withdraw
      await wbnb.withdraw(toWei('1', 'ether'), {from: bob});
      assert.equal(toWei('2', 'ether'), (await wbnb.balanceOf(bob)).toString());
    });

    it('shold withdraw iBNB to get bnb', async () => {
      // 1. Deposit
      await ibnb.deposit(toWei('8', 'ether'), {from: alice, value: toWei('8', 'ether')});
      // 2. Withdraw
      await ibnb.withdraw(toWei('6', 'ether'), {from: alice});

      assert.equal(toWei('2', 'ether'), (await ibnb.balanceOf(alice)).toString());
      assert.equal(toWei('2', 'ether'), (await wbnb.balanceOf(ibnb.address)).toString());
    });

    it('shold revert when deposit amount is more than banlance', async () => {
      await truffleAssert.fails(ibnb.deposit(toWei('500', 'ether'), {from: alice, value: toWei('500', 'ether')}));
    });

    it('shold revert when withdrawal amount is greater than deposit', async () => {
      await ibnb.deposit(toWei('5', 'ether'), {from: alice, value: toWei('5', 'ether')});

      await truffleAssert.fails(ibnb.withdraw(toWei('500', 'ether'), {from: alice}));
    });
  });

});