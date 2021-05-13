const { advanceBlockTo } = require('@openzeppelin/test-helpers/src/time');
const { assert } = require('chai');
const RubyToken = artifacts.require('RubyToken');
const GemMine = artifacts.require('GemMine');

contract('GemMine', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.ruby = await RubyToken.new({ from: minter });
    this.gem = await GemMine.new(this.ruby.address, { from: minter });
  });

  it('mint', async () => {
    await this.gem.mint(alice, 1000, { from: minter });
    assert.equal((await this.gem.balanceOf(alice)).toString(), '1000');
  });

  it('burn', async () => {
    await advanceBlockTo('650');
    await this.gem.mint(alice, 1000, { from: minter });
    await this.gem.mint(bob, 1000, { from: minter });
    assert.equal((await this.gem.totalSupply()).toString(), '2000');
    await this.gem.burn(alice, 200, { from: minter });

    assert.equal((await this.gem.balanceOf(alice)).toString(), '800');
    assert.equal((await this.gem.totalSupply()).toString(), '1800');
  });

  it('safeRubyTransfer', async () => {
    assert.equal(
      (await this.ruby.balanceOf(this.gem.address)).toString(),
      '0'
    );
    await this.ruby.mint(this.gem.address, 1000, { from: minter });
    await this.gem.safeRubyTransfer(bob, 200, { from: minter });
    assert.equal((await this.ruby.balanceOf(bob)).toString(), '200');
    assert.equal(
      (await this.ruby.balanceOf(this.gem.address)).toString(),
      '800'
    );
    await this.gem.safeRubyTransfer(bob, 2000, { from: minter });
    assert.equal((await this.ruby.balanceOf(bob)).toString(), '1000');
  });
});
