const {BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const truffleAssert = require('truffle-assertions');

const CheckToken = artifacts.require('CheckToken');
const ForkToken = artifacts.require('ForkToken');
const MockERC20 = artifacts.require('MockERC20');
const ForkFarmLaunch = artifacts.require("IDFO");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

contract('ForkFarmLaunch', async (accounts) => {
  const CHECK_REWARD_PER_BLOCK = web3.utils.toWei('1000', 'ether');
  let dev, alice, bob, minter;
  const { toWei } = web3.utils;
  const { fromWei } = web3.utils;

  beforeEach(async () => {
    // swapRouter = await UniswapV2Router02.deployed();
    // swapFactory = await UniswapV2Factory.deployed();
    // tokens

    // users
    [dev, alice, bob, dev, minter] = accounts;

    this.check = await CheckToken.new(1000, 1100, {from: minter});
    this.lp1 = await MockERC20.new('LPToken', 'LP1', '1000000', { from: minter });
    this.lp2 = await MockERC20.new('LPToken', 'LP2', '1000000', { from: minter });
    this.lp3 = await MockERC20.new('LPToken', 'LP3', '1000000', { from: minter });
    this.lp4 = await MockERC20.new('LPToken', 'LP4', '1000000', { from: minter });
    this.chef = await ForkFarmLaunch.new(this.check.address, dev, '1000', '100', 7000, 0, { from: minter });
    await this.check.transferOwnership(this.chef.address, { from: minter });

    await this.lp1.transfer(bob, '2000', { from: minter });
    await this.lp2.transfer(bob, '2000', { from: minter });
    await this.lp3.transfer(bob, '2000', { from: minter });
    await this.lp4.transfer(bob, '2000', { from: minter });

    await this.lp1.transfer(alice, '2000', { from: minter });
    await this.lp2.transfer(alice, '2000', { from: minter });
    await this.lp3.transfer(alice, '2000', { from: minter });
    await this.lp4.transfer(alice, '2000', { from: minter });
    
  })
  it('real case', async () => {
    await this.chef.add(0, '100', this.lp1.address, true, { from: minter });
    await this.chef.add(0, '100', this.lp2.address, true, { from: minter });
    await this.chef.add(0, '100', this.lp3.address, true, { from: minter });
    await this.chef.add(0, '100', this.lp4.address, true, { from: minter });

    await this.chef.add(1, '400', this.lp1.address, true, { from: minter });
    await this.chef.add(1, '400', this.lp2.address, true, { from: minter });
    await this.chef.add(1, '400', this.lp3.address, true, { from: minter });
    await this.chef.add(1, '400', this.lp4.address, true, { from: minter });

    assert.equal((await this.chef.poolLength()).toString(), "8");

    await time.advanceBlockTo('170');
    await this.lp1.approve(this.chef.address, '1000', { from: alice });
    assert.equal((await this.check.balanceOf(alice)).toString(), '0');
    await this.chef.deposit(0, '20', { from: alice });
    await this.chef.withdraw(0, '20', { from: alice });
    assert.equal((await this.check.balanceOf(alice)).toString(), 1000*100/(2000));
  })

  it('deposit/withdraw', async () => {
    await this.chef.add(0, '1000', this.lp1.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp2.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp3.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp4.address, true, { from: minter });

    await this.lp2.approve(this.chef.address, '100', { from: alice });
    await this.chef.deposit(1, '20', { from: alice });
    await this.chef.deposit(1, '0', { from: alice });
    await this.chef.deposit(1, '40', { from: alice });
    await this.chef.deposit(1, '0', { from: alice });
    assert.equal((await this.lp2.balanceOf(alice)).toString(), '1940');
    await this.chef.withdraw(1, '10', { from: alice });
    assert.equal((await this.lp2.balanceOf(alice)).toString(), '1950');
    assert.equal((await this.check.balanceOf(alice)).toString(), '999');
    assert.equal((await this.check.balanceOf(dev)).toString(), '100');

    await this.lp2.approve(this.chef.address, '100', { from: bob });
    assert.equal((await this.lp2.balanceOf(bob)).toString(), '2000');
    await this.chef.deposit(1, '50', { from: bob });
    assert.equal((await this.lp2.balanceOf(bob)).toString(), '1950');
    await this.chef.deposit(1, '0', { from: bob });
    assert.equal((await this.check.balanceOf(bob)).toString(), '125');
    await this.chef.emergencyWithdraw(1, { from: bob });
    assert.equal((await this.lp2.balanceOf(bob)).toString(), '2000');
  })

  it('deposit/withdraw', async () => {
    await this.chef.setBonus(8, (await time.latestBlock()).add(new BN('500')).toString(), 7000, {from: minter});
    await this.chef.add(0, '1000', this.lp1.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp2.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp3.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp4.address, true, { from: minter });

    await this.lp2.approve(this.chef.address, '100', { from: alice });
    await this.chef.deposit(1, '20', { from: alice }); 
    await this.chef.deposit(1, '0', { from: alice }); //250
    await this.chef.deposit(1, '40', { from: alice }); //250
    await this.chef.deposit(1, '0', { from: alice }); //250
    assert.equal((await this.lp2.balanceOf(alice)).toString(), '1940');
    await this.chef.withdraw(1, '10', { from: alice }); //250
    assert.equal((await this.lp2.balanceOf(alice)).toString(), '1950');
    assert.equal((await this.check.balanceOf(alice)).toString(), 1000*8*0.3+'');
    assert.equal((await this.check.lockOf(alice)).toString(), 1000*8*0.7+'');
    assert.equal((await this.check.balanceOf(dev)).toString(), 100*8*0.3+'');
    assert.equal((await this.check.lockOf(dev)).toString(), 100*8*0.7+'');

    // await this.lp2.approve(this.chef.address, '100', { from: bob });
    // assert.equal((await this.lp2.balanceOf(bob)).toString(), '2000');
    // await this.chef.deposit(1, '50', { from: bob });
    // assert.equal((await this.lp2.balanceOf(bob)).toString(), '1950');
    // await this.chef.deposit(1, '0', { from: bob });
    // assert.equal((await this.check.balanceOf(bob)).toString(), '125');
    // await this.chef.emergencyWithdraw(1, { from: bob });
    // assert.equal((await this.lp2.balanceOf(bob)).toString(), '2000');
  })

  it('depositCheckToCash/cash', async () => {
    await this.chef.setBonus(8, (await time.latestBlock()).add(new BN('500')).toString(), 7000, {from: minter});
    await this.chef.add(0, '1000', this.lp1.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp2.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp3.address, true, { from: minter });
    await this.chef.add(0, '1000', this.lp4.address, true, { from: minter });

    await this.lp2.approve(this.chef.address, '100', { from: alice });
    await this.chef.deposit(1, '20', { from: alice }); 
    await this.chef.withdraw(1, '20', { from: alice }); //600
    assert.equal((await this.check.balanceOf(alice)).toString(), '600');

    this.fork = await MockERC20.new('ForkToken', 'FORK', '1000000', { from: minter });

    await this.fork.transfer(this.chef.address, '1000', {from: minter});

    await this.chef.addCashPool('520', this.fork.address, (await time.latest()).sub(time.duration.seconds('100')).toString(), (await time.latest()).add(time.duration.seconds('58')).toString(), 0, {from: minter});
    await this.chef.addCashPool('480', this.fork.address, (await time.latest()).add(time.duration.seconds('60')).toString(), (await time.latest()).add(time.duration.seconds('119')).toString(), 0, {from: minter});

    await this.check.approve(this.chef.address, '100', { from: alice});
    await this.chef.depositCheckToCashPool(0, 100, {from: alice});
    assert.equal((await this.check.balanceOf(alice)).toString(), '500');
    assert.equal((await this.check.balanceOf(this.chef.address)).toString(), '100');
    await time.increase(time.duration.seconds('59'));
    await this.chef.cashCheck(0, {from: alice});
    assert.equal((await this.fork.balanceOf(alice)).toString(), '520');
    assert.equal((await this.check.balanceOf(this.chef.address)).toString(), '0');

  });



  // it('update multiplier', async () => {
  //   await this.chef.add(0, '1000', this.check.address, true, { from: minter });
  //   await this.chef.add(0, '1000', this.lp2.address, true, { from: minter });
  //   await this.chef.add(0, '1000', this.lp3.address, true, { from: minter });
  //   await this.chef.add(0, '1000', this.lp4.address, true, { from: minter });

  //   await this.lp2.approve(this.chef.address, '100', { from: alice });
  //   await this.lp2.approve(this.chef.address, '100', { from: bob });
  //   await this.chef.deposit(1, '100', { from: alice }); 
  //   await this.chef.deposit(1, '100', { from: bob }); // 250
  //   await this.chef.deposit(1, '0', { from: alice }); // 125 125
  //   await this.chef.deposit(1, '0', { from: bob }); // 125 125

  //   await this.check.approve(this.chef.address, '100', { from: alice });
  //   await this.check.approve(this.chef.address, '100', { from: bob });
  //   await this.chef.deposit(0, '50', { from: alice }); 
  //   await this.chef.deposit(0, '100', { from: bob }); // 250

  //   await this.chef.updateMultiplier('0', { from: minter });

  //   await this.chef.deposit(0, '0', { from: alice });
  //   await this.chef.deposit(0, '0', { from: bob });
  //   await this.chef.deposit(1, '0', { from: alice });
  //   await this.chef.deposit(1, '0', { from: bob });

  //   assert.equal((await this.check.balanceOf(alice)).toString(), toWei('750', 'ether')-50, 'err1');
  //   assert.equal((await this.check.balanceOf(bob)).toString(), toWei('250', 'ether')-100, 'err2');

  //   await time.advanceBlockTo('265');

  //   await this.chef.deposit(0, '0', { from: alice });
  //   await this.chef.deposit(0, '0', { from: bob });
  //   await this.chef.deposit(1, '0', { from: alice });
  //   await this.chef.deposit(1, '0', { from: bob });

  //   assert.equal((await this.check.balanceOf(alice)).toString(), toWei('750', 'ether')-50, 'err3');
  //   assert.equal((await this.check.balanceOf(bob)).toString(), toWei('250', 'ether')-100, 'err4');

  //   await this.chef.withdraw(0, '50', { from: alice });
  //   await this.chef.withdraw(0, '100', { from: bob });
  //   await this.chef.withdraw(1, '100', { from: alice });
  //   await this.chef.withdraw(1, '100', { from: bob });

  // });

  it('should allow dev and only dev to update dev', async () => {
    assert.equal((await this.chef.devaddr()).valueOf(), dev);
    await expectRevert(this.chef.setDev(bob, { from: bob }), 'dev: wut?');
    await this.chef.setDev(bob, { from: dev });
    assert.equal((await this.chef.devaddr()).valueOf(), bob);
    await this.chef.setDev(alice, { from: bob });
    assert.equal((await this.chef.devaddr()).valueOf(), alice);
  })
});