const truffleAssert = require('truffle-assertions');

const ForkToken = artifacts.require('ForkToken');
const iBNB = artifacts.require('iBNB');
const iBUSD = artifacts.require('iBUSD');
const MockWBNB = artifacts.require('MockWBNB');
const MockDai = artifacts.require('MockDai');
const MockERC20 = artifacts.require('MockERC20');
const FairLaunch = artifacts.require("FairLaunch");

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

contract('FairLaunch', async (accounts) => {
  const FORK_REWARD_PER_BLOCK = web3.utils.toWei('5000', 'ether');
  const BONUS_LOCK_BPS = '7000';

  let deployer, alice, bob, dev;
  const { toWei } = web3.utils;
  const { fromWei } = web3.utils;

  let fork, dai, wbnb, ibusd, ibnb, xxx;
  let fork_addr, dai_addr, wbnb_addr, ibusd_addr, ibnb_addr, xxx_addr;

  let fairLaunch;
  let swapRouter, swapFactory;
  let stakingTokens = [];

  beforeEach(async () => {
    // pancake-swap
    swapRouter = await UniswapV2Router02.deployed();
    swapFactory = await UniswapV2Factory.deployed();
    // tokens
    forkToken = await ForkToken.new(132, 137);

    // dai = await MockDai.new();
    // wbnb = await MockWBNB.new();
    // ibusd = await iBUSD.new(dai.address);
    // ibnb = await iBNB.new(wbnb.address);
    // xxx = await MockERC20.new('xxx', 'xxx');

    // users
    [deployer, alice, bob, dev] = accounts;
    // FairLaunch
    fairLaunch = await FairLaunch.new(forkToken.address, deployer, FORK_REWARD_PER_BLOCK, 0, BONUS_LOCK_BPS, 0);
    await forkToken.transferOwnership(fairLaunch.address);
    // pools
    for (let i = 0; i < 4; i++) {
      const mockERC20 = await MockERC20.new(`STOKEN${i}`, `STOKEN${i}`);
      stakingTokens.push(mockERC20);
    }
    // stakingTokens = [dai, ibusd, ibnb];
  })

  describe('when adjust params', () => {
    it('should add new pool', async () => {
      for (let i = 0; i < stakingTokens.length; i++) {
        await fairLaunch.addPool(1, stakingTokens[i].address, false, {from: deployer});
      }
      assert.equal(stakingTokens.length, (await fairLaunch.poolLength()));
    });

    it('should revert when the stakeToken is already added to the pool', async () => {
      for (let i = 0; i < stakingTokens.length; i++) {
        await fairLaunch.addPool(1, stakingTokens[i].address, false);
      }
      assert.equal(stakingTokens.length, (await fairLaunch.poolLength()));
      await truffleAssert.reverts(fairLaunch.addPool(1, stakingTokens[0].address, false), "add: stakeToken dup")
    });
  });

  describe('when use pool', () => {
    it('should revert when there is nothing to be harvested', async() => {
      await fairLaunch.addPool(1, stakingTokens[0].address, false);
      await truffleAssert.reverts(fairLaunch.harvest(0), "nothing to harvest");
    });

    it('should revert when that pool is not existed', async() => {
      await truffleAssert.reverts(fairLaunch.deposit(77, toWei('100', 'ether')), "pool is not existed");
    });

    // it('should revert when withdrawer is not a funder', async () => {
    //   // 1. Mint STOKEN0 for staking
    //   await stakingTokens[0].mint(alice, toWei('400', 'ether'), {from: deployer});

    //   // 2. Add STOKEN0 to the fairLaunch pool
    //   await fairLaunch.addPool(1, stakingTokens[0].address, false, {from: deployer});

    //   // 3. Deposit STOKEN0 to the STOKEN0 pool
    //   await stakingTokens[0].approve(fairLaunch.address, etherToWei('100'), {from: alice});
    //   await fairLaunch.deposit(bob, 0, etherToWei('100'), {from: alice});

    //   // 4. Bob try to withdraw from the pool
    //   // Bob shuoldn't do that, he can get yield but not the underlaying
    //   await truffleAssert.reverts(fairLaunch.withdrawAll(bob, 0, {from: bob}), "only funder");
    // });

    // it('should revert when 2 accounts try to fund the same user', async () => {
    //   // 1. Mint STOKEN0 for staking
    //   await stakingTokens[0].mint(alice, etherToWei('400'), {from: deployer});
    //   await stakingTokens[0].mint(deployer, etherToWei('100'), {from: deployer});

    //   // 2. Add STOKEN0 to the fairLaunch pool
    //   await fairLaunch.addPool(1, stakingTokens[0].address, false, {from: deployer});

    //   // 3. Deposit STOKEN0 to the STOKEN0 pool
    //   await stakingTokens[0].approve(fairLaunch.address, etherToWei('100'), {from: alice});
    //   await fairLaunch.deposit(bob, 0, etherToWei('100'), {from: alice});

    //   // 4. Dev try to deposit to the pool on the bahalf of Bob
    //   // Dev should get revert tx as this will fuck up the tracking
    //   await stakingTokens[0].approve(fairLaunch.address, etherToWei("100"), {from: deployer});
    //   await truffleAssert.reverts(fairLaunch.deposit(bob, 0, etherToWei('1'), {from: deployer}), 'bad sof');
    // });

    // it('should harvest yield from the position opened by funder', async () => {
    //   // 1. Mint STOKEN0 for staking
    //   await stakingTokens[0].mint(alice, toWei('400'), {from: deployer});

    //   // 2. Add STOKEN0 to the STOKEN0 pool
    //   await fairLaunch.addPool(1, stakingTokens[0].address, false);

    //   // 3. Desposit STOKEN0 to the STOKEN0 pool
    //   await stakingTokens[0].approve(fairLaunch.address, toWei('100'), {from: alice});
    //   await fairLaunch.deposit(bob, 0, etherToWei('100'), {from: alice});

    //   // 4. Move 1 Block so there is some pending
    //   await fairLaunch.massUpdatePools({from: deployer});
    //   assert.equal(etherToWei('5000'), (await fairLaunch.pendingAlpaca(0, bob, {from: bob})).toString());

    //   // 5. Harvest all yield
    //   await fairLaunch.harvest(0, {from: bob});

    //   assert.equal(etherToWei('10000'), (await forkToken.balanceOf(bob)).toString());
    // });

    it('should distribute rewards according to the alloc point', async() => {
      // 1. Mint STOKEN0 and STOKEN1 for staking
      await stakingTokens[0].mint(alice, etherToWei('100'), {from: deployer});
      await stakingTokens[1].mint(alice, etherToWei('50'), {from: deployer});

      // 2. Add STOKEN0 to the fairLaunch pool
      await fairLaunch.addPool(50, stakingTokens[0].address, false, {from: deployer});
      await fairLaunch.addPool(50, stakingTokens[1].address, false, {from: deployer});

      // 3. Deposit STOKEN0 to the STOKEN0 pool
      await stakingTokens[0].approve(fairLaunch.address, etherToWei('100'), {from: alice});
      await fairLaunch.deposit(0, etherToWei('100'), {from: alice});

      // 4. Desposit STOKEN1 to the STOKEN1 pool
      await stakingTokens[1].approve(fairLaunch.address, etherToWei('50'), {from: alice});
      await fairLaunch.deposit(1, etherToWei('50'), {from: alice});

      // 5. Move 1 Block so there is some pending
      await fairLaunch.massUpdatePools({from: deployer});

      assert.equal(etherToWei('7500'), (await fairLaunch.pendingAlpaca(0, alice, {from: alice})).toString());
      assert.equal(etherToWei('2500'), (await fairLaunch.pendingAlpaca(1, alice, {from: alice})).toString());

      // 6. Harvest all yield
      await fairLaunch.harvest(0, {from: alice});
      await fairLaunch.harvest(1, {from: alice});

      assert.equal(etherToWei('17500'), (await forkToken.balanceOf(alice)).toString());
    })

  });
});

const etherToWei = (ether) => {
  return web3.utils.toWei(ether, 'ether');
}

