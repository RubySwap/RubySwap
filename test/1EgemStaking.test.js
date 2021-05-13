const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const RubyToken = artifacts.require('RubyToken');
const EgemStaking = artifacts.require('EgemStaking');
const MockBEP20 = artifacts.require('libs/MockBEP20');
const WEGEM = artifacts.require('libs/WEGEM');

contract('EgemStaking.......', async ([alice, bob, admin, dev, minter]) => {
  beforeEach(async () => {
    this.rewardToken = await RubyToken.new({ from: minter });
    this.lpToken = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.wEGEM = await WEGEM.new({ from: minter });
    this.egemJeweler = await EgemStaking.new(
      this.wEGEM.address,
      this.rewardToken.address,
      1000,
      10,
      1010,
      admin,
      this.wEGEM.address,
      { from: minter }
    );
    await this.rewardToken.mint(this.egemJeweler.address, 100000, { from: minter });
  });

  it('deposit/withdraw', async () => {
    await time.advanceBlockTo('10');
    await this.egemJeweler.deposit({ from: alice, value: 100 });
    await this.egemJeweler.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wEGEM.balanceOf(this.egemJeweler.address)).toString(),
      '300'
    );
    assert.equal((await this.egemJeweler.pendingReward(alice)).toString(), '1000');
    await this.egemJeweler.deposit({ from: alice, value: 300 });
    assert.equal((await this.egemJeweler.pendingReward(alice)).toString(), '0');
    assert.equal((await this.rewardToken.balanceOf(alice)).toString(), '1333');
    await this.egemJeweler.withdraw('100', { from: alice });
    assert.equal(
      (await this.wEGEM.balanceOf(this.egemJeweler.address)).toString(),
      '500'
    );
    await this.egemJeweler.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.egemJeweler.pendingReward(bob)).toString(), '1399');
  });

  it('emergencyWithdraw', async () => {
    await this.egemJeweler.deposit({ from: alice, value: 100 });
    await this.egemJeweler.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wEGEM.balanceOf(this.egemJeweler.address)).toString(),
      '300'
    );
    await this.egemJeweler.emergencyWithdraw({ from: alice });
    assert.equal(
      (await this.wEGEM.balanceOf(this.egemJeweler.address)).toString(),
      '200'
    );
    assert.equal((await this.wEGEM.balanceOf(alice)).toString(), '100');
  });

  it('emergencyRewardWithdraw', async () => {
    await expectRevert(
      this.egemJeweler.emergencyRewardWithdraw(100, { from: alice }),
      'caller is not the owner'
    );
    await this.egemJeweler.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.rewardToken.balanceOf(minter)).toString(), '1000');
  });
});
