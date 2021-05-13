const { expectRevert, time } = require('@openzeppelin/test-helpers');
const RubyToken = artifacts.require('RubyToken');
const MasterJeweler = artifacts.require('MasterJeweler');
const GemMine = artifacts.require('GemMine');
const ApprenticeJeweler = artifacts.require('ApprenticeJeweler');
const MockBEP20 = artifacts.require('libs/MockBEP20');

contract('ApprenticeJeweler', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.gem = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.jeweler = await ApprenticeJeweler.new(this.gem.address, '40', '300', '400', {
      from: minter,
    });
  });

  it('sous jeweler now', async () => {
    await this.gem.transfer(bob, '1000', { from: minter });
    await this.gem.transfer(carol, '1000', { from: minter });
    await this.gem.transfer(alice, '1000', { from: minter });
    assert.equal((await this.gem.balanceOf(bob)).toString(), '1000');

    await this.gem.approve(this.jeweler.address, '1000', { from: bob });
    await this.gem.approve(this.jeweler.address, '1000', { from: alice });
    await this.gem.approve(this.jeweler.address, '1000', { from: carol });

    await this.jeweler.deposit('10', { from: bob });
    assert.equal(
      (await this.gem.balanceOf(this.jeweler.address)).toString(),
      '10'
    );

    await time.advanceBlockTo('300');

    await this.jeweler.deposit('30', { from: alice });
    assert.equal(
      (await this.gem.balanceOf(this.jeweler.address)).toString(),
      '40'
    );
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '40'
    );

    await time.advanceBlockTo('302');
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '50'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '30'
    );

    await this.jeweler.deposit('40', { from: carol });
    assert.equal(
      (await this.gem.balanceOf(this.jeweler.address)).toString(),
      '80'
    );
    await time.advanceBlockTo('304');
    //  bob 10, alice 30, carol 40
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '65'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '75'
    );
    assert.equal(
      (await this.jeweler.pendingReward(carol, { from: carol })).toString(),
      '20'
    );

    await this.jeweler.deposit('20', { from: alice }); // 305 bob 10, alice 50, carol 40
    await this.jeweler.deposit('30', { from: bob }); // 306  bob 40, alice 50, carol 40

    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '74'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '110'
    );

    await time.advanceBlockTo('307');
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '86'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '125'
    );

    await this.jeweler.withdraw('20', { from: alice }); // 308 bob 40, alice 30, carol 40
    await this.jeweler.withdraw('30', { from: bob }); // 309  bob 10, alice 30, carol 40

    await time.advanceBlockTo('310');
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '118'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '166'
    );
    assert.equal(
      (await this.gem.balanceOf(this.jeweler.address)).toString(),
      '80'
    );

    await time.advanceBlockTo('400');
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.jeweler.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );

    await time.advanceBlockTo('420');
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.jeweler.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );

    await this.jeweler.withdraw('10', { from: bob });
    await this.jeweler.withdraw('30', { from: alice });
    await expectRevert(this.jeweler.withdraw('50', { from: carol }), 'not enough');
    await this.jeweler.deposit('30', { from: carol });
    await time.advanceBlockTo('450');
    assert.equal(
      (await this.jeweler.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.jeweler.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );
    await this.jeweler.withdraw('70', { from: carol });
    assert.equal((await this.jeweler.addressLength()).toString(), '3');
  });

  it('try gem', async () => {
    this.ruby = await RubyToken.new({ from: minter });
    this.gem = await GemMine.new(this.ruby.address, { from: minter });
    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.jeweler = await MasterJeweler.new(
      this.ruby.address,
      this.gem.address,
      dev,
      '1000',
      '300',
      { from: minter }
    );
    await this.ruby.transferOwnership(this.jeweler.address, { from: minter });
    await this.gem.transferOwnership(this.jeweler.address, { from: minter });
    await this.lp1.transfer(bob, '2000', { from: minter });
    await this.lp1.transfer(alice, '2000', { from: minter });

    await this.lp1.approve(this.jeweler.address, '1000', { from: alice });
    await this.ruby.approve(this.jeweler.address, '1000', { from: alice });

    await this.jeweler.add('1000', this.lp1.address, true, { from: minter });
    await this.jeweler.deposit(1, '20', { from: alice });
    await time.advanceBlockTo('500');
    await this.jeweler.deposit(1, '0', { from: alice });
    await this.jeweler.add('1000', this.lp1.address, true, { from: minter });

    await this.jeweler.enterStaking('10', { from: alice });
    await time.advanceBlockTo('510');
    await this.jeweler.enterStaking('10', { from: alice });

    this.jeweler2 = await ApprenticeJeweler.new(this.gem.address, '40', '600', '800', {
      from: minter,
    });
    await this.gem.approve(this.jeweler2.address, '10', { from: alice });
    await time.advanceBlockTo('590');
    this.jeweler2.deposit('10', { from: alice }); //520
    await time.advanceBlockTo('610');
    assert.equal(
      (await this.gem.balanceOf(this.jeweler2.address)).toString(),
      '10'
    );
    assert.equal(
      (await this.jeweler2.pendingReward(alice, { from: alice })).toString(),
      '400'
    );
  });

  it('emergencyWithdraw', async () => {
    await this.gem.transfer(alice, '1000', { from: minter });
    assert.equal((await this.gem.balanceOf(alice)).toString(), '1000');

    await this.gem.approve(this.jeweler.address, '1000', { from: alice });
    await this.jeweler.deposit('10', { from: alice });
    assert.equal((await this.gem.balanceOf(alice)).toString(), '990');
    await this.jeweler.emergencyWithdraw({ from: alice });
    assert.equal((await this.gem.balanceOf(alice)).toString(), '1000');
    assert.equal(
      (await this.jeweler.pendingReward(alice, { from: alice })).toString(),
      '0'
    );
  });
});
