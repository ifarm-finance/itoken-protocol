const { expectRevert, time, ether, constants, BN } = require('@openzeppelin/test-helpers');
const iTokenDelegate = artifacts.require("iTokenDelegate");
const iTokenDelegator = artifacts.require("iTokenDelegator");
const MockERC20 = artifacts.require("MockERC20");
const blenheimPalace = artifacts.require("BlenheimPalace");
const rockefellerManor = artifacts.require("RockefellerManor");
const yasnayaPolyana = artifacts.require("YasnayaPolyana");

const poolContracts = [
    blenheimPalace,         // rUSD
    yasnayaPolyana,         // rBTC
    rockefellerManor        // rETH
]

contract('Blenheim Palace Pool', ([alice, bob, carol]) => {
    before(async () => {
        this.poolId = 0
        // delopy contract
        let implementation = await iTokenDelegate.new()
        this.rToken = await iTokenDelegator.new(
            "Mock RiceQuant Token",
            "rToken",
            18,
            ether('5'), // print extra few mil for user (≈$5)
            implementation.address,
            "0x"
        )
        this.lpToken = await MockERC20.new("Mock Tether", "USDT", 18, ether('800000'))
        let poolContract = poolContracts[this.poolId]
        this.pool = await poolContract.new()

        // settings
        await this.pool.setiToken(this.rToken.address)
        await this.pool.setLPToken(this.lpToken.address)
        await this.rToken._setIncentivizer(this.pool.address)
        await this.pool.setRewardDistribution(alice)
        await this.pool.notifyRewardAmount(ether('20000'))

        await this.lpToken.approve(this.pool.address, constants.MAX_UINT256)
        this.starttime = await this.pool.starttime()
        console.log(`starttime: ${this.starttime.toString()}`)
        await time.increaseTo(this.starttime)
    });

    it('Initial pledge 10 ether', async () => {
        this.lastRewardRate = new BN('0')
        await this.pool.stake(ether('10'))
        let initreward = await this.pool.initreward()
        assert.equal(initreward.toString(), ether('2000000').toString())
        let rewardRate = await this.pool.rewardRate()
        await this.pool.exit()
    });

    it('The second phase pledge 10 ether', async () => {
        let periodFinish = await this.pool.periodFinish()
        // Push to the next issue
        await time.increaseTo(periodFinish.toString())
        this.lastRewardRate = await this.pool.rewardRate()
        await this.pool.stake(ether('10'))
        let initreward = await this.pool.initreward()
        assert.equal(initreward.toString(), ether('1000000').toString())
        let rewardRate = await this.pool.rewardRate()
        assert.equal(this.lastRewardRate.div(rewardRate).toString(), '2')
        await this.pool.exit()
    });

    it('The second phase pledge 10 ether', async () => {
        let periodFinish = await this.pool.periodFinish()
        // Push to the next issue
        await time.increaseTo(periodFinish.toString())
        this.lastRewardRate = await this.pool.rewardRate()
        await this.pool.stake(ether('10'))
        let initreward = await this.pool.initreward()
        assert.equal(initreward.toString(), ether('500000').toString())
        let rewardRate = await this.pool.rewardRate()
        assert.equal(this.lastRewardRate.div(rewardRate).toString(), '2')
        await this.pool.exit()
    });



});
