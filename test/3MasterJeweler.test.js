const { expectRevert, time } = require('@openzeppelin/test-helpers');
const RubyToken = artifacts.require('RubyToken');
const GemMine = artifacts.require('GemMine');
const MasterJeweler = artifacts.require('MasterJeweler');
const MockBEP20 = artifacts.require('libs/MockBEP20');

contract('MasterJeweler', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.ruby = await RubyToken.new({ from: minter });
        this.gem = await GemMine.new(this.ruby.address, { from: minter });
        this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.lp2 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
        this.lp3 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
        this.jeweler = await MasterJeweler.new(this.ruby.address, this.gem.address, dev, '1000', '100', { from: minter });
        await this.ruby.transferOwnership(this.jeweler.address, { from: minter });
        await this.gem.transferOwnership(this.jeweler.address, { from: minter });

        await this.lp1.transfer(bob, '2000', { from: minter });
        await this.lp2.transfer(bob, '2000', { from: minter });
        await this.lp3.transfer(bob, '2000', { from: minter });

        await this.lp1.transfer(alice, '2000', { from: minter });
        await this.lp2.transfer(alice, '2000', { from: minter });
        await this.lp3.transfer(alice, '2000', { from: minter });
    });
    it('real case', async () => {
      this.lp4 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp5 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp6 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
      this.lp7 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp8 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp9 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
      await this.jeweler.add('2000', this.lp1.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp2.address, true, { from: minter });
      await this.jeweler.add('500', this.lp3.address, true, { from: minter });
      await this.jeweler.add('500', this.lp3.address, true, { from: minter });
      await this.jeweler.add('500', this.lp3.address, true, { from: minter });
      await this.jeweler.add('500', this.lp3.address, true, { from: minter });
      await this.jeweler.add('500', this.lp3.address, true, { from: minter });
      await this.jeweler.add('100', this.lp3.address, true, { from: minter });
      await this.jeweler.add('100', this.lp3.address, true, { from: minter });
      assert.equal((await this.jeweler.poolLength()).toString(), "10");

      await time.advanceBlockTo('170');
      await this.lp1.approve(this.jeweler.address, '1000', { from: alice });
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '0');
      await this.jeweler.deposit(1, '20', { from: alice });
      await this.jeweler.withdraw(1, '20', { from: alice });
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '263');

      await this.ruby.approve(this.jeweler.address, '1000', { from: alice });
      await this.jeweler.enterStaking('20', { from: alice });
      await this.jeweler.enterStaking('0', { from: alice });
      await this.jeweler.enterStaking('0', { from: alice });
      await this.jeweler.enterStaking('0', { from: alice });
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '993');
      // assert.equal((await this.jeweler.getPoolPoint(0, { from: minter })).toString(), '1900');
    })


    it('deposit/withdraw', async () => {
      await this.jeweler.add('1000', this.lp1.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp2.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.jeweler.address, '100', { from: alice });
      await this.jeweler.deposit(1, '20', { from: alice });
      await this.jeweler.deposit(1, '0', { from: alice });
      await this.jeweler.deposit(1, '40', { from: alice });
      await this.jeweler.deposit(1, '0', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1940');
      await this.jeweler.withdraw(1, '10', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1950');
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '999');
      assert.equal((await this.ruby.balanceOf(dev)).toString(), '100');

      await this.lp1.approve(this.jeweler.address, '100', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
      await this.jeweler.deposit(1, '50', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '1950');
      await this.jeweler.deposit(1, '0', { from: bob });
      assert.equal((await this.ruby.balanceOf(bob)).toString(), '125');
      await this.jeweler.emergencyWithdraw(1, { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
    })

    it('staking/unstaking', async () => {
      await this.jeweler.add('1000', this.lp1.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp2.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.jeweler.address, '10', { from: alice });
      await this.jeweler.deposit(1, '2', { from: alice }); //0
      await this.jeweler.withdraw(1, '2', { from: alice }); //1

      await this.ruby.approve(this.jeweler.address, '250', { from: alice });
      await this.jeweler.enterStaking('240', { from: alice }); //3
      assert.equal((await this.gem.balanceOf(alice)).toString(), '240');
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '10');
      await this.jeweler.enterStaking('10', { from: alice }); //4
      assert.equal((await this.gem.balanceOf(alice)).toString(), '250');
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '249');
      await this.jeweler.leaveStaking(250);
      assert.equal((await this.gem.balanceOf(alice)).toString(), '0');
      assert.equal((await this.ruby.balanceOf(alice)).toString(), '749');

    });


    it('updaate multiplier', async () => {
      await this.jeweler.add('1000', this.lp1.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp2.address, true, { from: minter });
      await this.jeweler.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.jeweler.address, '100', { from: alice });
      await this.lp1.approve(this.jeweler.address, '100', { from: bob });
      await this.jeweler.deposit(1, '100', { from: alice });
      await this.jeweler.deposit(1, '100', { from: bob });
      await this.jeweler.deposit(1, '0', { from: alice });
      await this.jeweler.deposit(1, '0', { from: bob });

      await this.ruby.approve(this.jeweler.address, '100', { from: alice });
      await this.ruby.approve(this.jeweler.address, '100', { from: bob });
      await this.jeweler.enterStaking('50', { from: alice });
      await this.jeweler.enterStaking('100', { from: bob });

      await this.jeweler.updateMultiplier('0', { from: minter });

      await this.jeweler.enterStaking('0', { from: alice });
      await this.jeweler.enterStaking('0', { from: bob });
      await this.jeweler.deposit(1, '0', { from: alice });
      await this.jeweler.deposit(1, '0', { from: bob });

      assert.equal((await this.ruby.balanceOf(alice)).toString(), '700');
      assert.equal((await this.ruby.balanceOf(bob)).toString(), '150');

      await time.advanceBlockTo('265');

      await this.jeweler.enterStaking('0', { from: alice });
      await this.jeweler.enterStaking('0', { from: bob });
      await this.jeweler.deposit(1, '0', { from: alice });
      await this.jeweler.deposit(1, '0', { from: bob });

      assert.equal((await this.ruby.balanceOf(alice)).toString(), '700');
      assert.equal((await this.ruby.balanceOf(bob)).toString(), '150');

      await this.jeweler.leaveStaking('50', { from: alice });
      await this.jeweler.leaveStaking('100', { from: bob });
      await this.jeweler.withdraw(1, '100', { from: alice });
      await this.jeweler.withdraw(1, '100', { from: bob });

    });

    it('should allow dev and only dev to update dev', async () => {
        assert.equal((await this.jeweler.devaddr()).valueOf(), dev);
        await expectRevert(this.jeweler.dev(bob, { from: bob }), 'dev: wut?');
        await this.jeweler.dev(bob, { from: dev });
        assert.equal((await this.jeweler.devaddr()).valueOf(), bob);
        await this.jeweler.dev(alice, { from: bob });
        assert.equal((await this.jeweler.devaddr()).valueOf(), alice);
    })
});
