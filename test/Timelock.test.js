const { expectRevert, time } = require('@openzeppelin/test-helpers');
const ethers = require('ethers');
const RubyToken = artifacts.require('RubyToken');
const MasterJeweler = artifacts.require('MasterJeweler');
const MockBEP20 = artifacts.require('libs/MockBEP20');
const Timelock = artifacts.require('Timelock');
const GemMine = artifacts.require('GemMine');

function encodeParameters(types, values) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

contract('Timelock', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.ruby = await RubyToken.new({ from: alice });
        this.timelock = await Timelock.new(bob, '28800', { from: alice }); //8hours
    });

    it('should not allow non-owner to do operation', async () => {
        await this.ruby.transferOwnership(this.timelock.address, { from: alice });
        await expectRevert(
            this.ruby.transferOwnership(carol, { from: alice }),
            'Ownable: caller is not the owner',
        );
        await expectRevert(
            this.ruby.transferOwnership(carol, { from: bob }),
            'Ownable: caller is not the owner',
        );
        await expectRevert(
            this.timelock.queueTransaction(
                this.ruby.address, '0', 'transferOwnership(address)',
                encodeParameters(['address'], [carol]),
                (await time.latest()).add(time.duration.hours(6)),
                { from: alice },
            ),
            'Timelock::queueTransaction: Call must come from admin.',
        );
    });

    it('should do the timelock thing', async () => {
        await this.ruby.transferOwnership(this.timelock.address, { from: alice });
        const eta = (await time.latest()).add(time.duration.hours(9));
        await this.timelock.queueTransaction(
            this.ruby.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [carol]), eta, { from: bob },
        );
        await time.increase(time.duration.hours(1));
        await expectRevert(
            this.timelock.executeTransaction(
                this.ruby.address, '0', 'transferOwnership(address)',
                encodeParameters(['address'], [carol]), eta, { from: bob },
            ),
            "Timelock::executeTransaction: Transaction hasn't surpassed time lock.",
        );
        await time.increase(time.duration.hours(8));
        await this.timelock.executeTransaction(
            this.ruby.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [carol]), eta, { from: bob },
        );
        assert.equal((await this.ruby.owner()).valueOf(), carol);
    });

    it('should also work with MasterJeweler', async () => {
        this.lp1 = await MockBEP20.new('LPToken', 'LP', '10000000000', { from: minter });
        this.lp2 = await MockBEP20.new('LPToken', 'LP', '10000000000', { from: minter });
        this.gem = await GemMine.new(this.ruby.address, { from: minter });
        this.jeweler = await MasterJeweler.new(this.ruby.address, this.gem.address, dev, '1000', '0', { from: alice });
        await this.ruby.transferOwnership(this.jeweler.address, { from: alice });
        await this.gem.transferOwnership(this.jeweler.address, { from: minter });
        await this.jeweler.add('100', this.lp1.address, true, { from: alice });
        await this.jeweler.transferOwnership(this.timelock.address, { from: alice });
        await expectRevert(
            this.jeweler.add('100', this.lp1.address, true, { from: alice }),
            "revert Ownable: caller is not the owner",
        );

        const eta = (await time.latest()).add(time.duration.hours(9));
        await this.timelock.queueTransaction(
            this.jeweler.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [minter]), eta, { from: bob },
        );
        // await this.timelock.queueTransaction(
        //     this.jeweler.address, '0', 'add(uint256,address,bool)',
        //     encodeParameters(['uint256', 'address', 'bool'], ['100', this.lp2.address, false]), eta, { from: bob },
        // );
        await time.increase(time.duration.hours(9));
        await this.timelock.executeTransaction(
            this.jeweler.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [minter]), eta, { from: bob },
        );
        await expectRevert(
            this.jeweler.add('100', this.lp1.address, true, { from: alice }),
            "revert Ownable: caller is not the owner",
        );
        await this.jeweler.add('100', this.lp1.address, true, { from: minter })
        // await this.timelock.executeTransaction(
        //     this.jeweler.address, '0', 'add(uint256,address,bool)',
        //     encodeParameters(['uint256', 'address', 'bool'], ['100', this.lp2.address, false]), eta, { from: bob },
        // );
        // assert.equal((await this.jeweler.poolInfo('0')).valueOf().allocPoint, '200');
        // assert.equal((await this.jeweler.totalAllocPoint()).valueOf(), '300');
        // assert.equal((await this.jeweler.poolLength()).valueOf(), '2');
    });
});
