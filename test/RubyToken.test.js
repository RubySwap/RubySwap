const { assert } = require("chai");

const RubyToken = artifacts.require('RubyToken');

contract('RubyToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.ruby = await RubyToken.new({ from: minter });
    });


    it('mint', async () => {
        await this.ruby.mint(alice, 1000, { from: minter });
        assert.equal((await this.ruby.balanceOf(alice)).toString(), '1000');
    })
});
