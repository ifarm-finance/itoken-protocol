const { expectRevert, time } = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;
const path = require('path');
const IFADevRewards = artifacts.require('IFADevRewards');
const iTokenDelegate = artifacts.require("iTokenDelegate");
const iTokenDelegator = artifacts.require("iTokenDelegator");
const BlenheimPalace = artifacts.require('BlenheimPalace');
const MockERC20 = artifacts.require("MockERC20");
const fs = require('fs');

let basedir = path.dirname(path.dirname(__dirname));
let contractJsonPath = path.join(basedir, 'build/contracts');

const MockERC20Json = require(path.join(contractJsonPath, "MockERC20.json"));
const iTokenJson = require(path.join(contractJsonPath, "iTokenDelegator.json"));
const blenheimPalace = require(path.join(contractJsonPath, "BlenheimPalace.json"));

const tokenAddress = {
    'iUSD': "0x5C06F3eB9cF03D026ED7D7e8eA2c0F2a02A30052",
    'sCRVLP': "0x6BF1DbEcccd5F3a4d57beC45E9eA3e5f7edc9e7d",
    'blenheimPalace': "0xa31c929A3b5896b54911B20A4dd6D7621C38dCDe"
}

function toWei(bigNumber) {
    return web3.utils.toWei(bigNumber);
}

contract('Blenheim Palace Pool', ([alice, bob, carol]) => {
    this.approveAmount = toWei('99990000');

    const getEarned = async (_account, _rewardPerToken, _poolContractObject) => {
        let balanceOf = new BN(`${await _poolContractObject.methods.balanceOf(_account).call()}`);
        let userRewardPerTokenPaid = new BN(`${await _poolContractObject.methods.userRewardPerTokenPaid(_account).call()}`);
        let rewards = new BN(`${await _poolContractObject.methods.rewards(_account).call()}`);
        let dec = new BN(toWei('1'));
        // console.log(balanceOf.toString(), _rewardPerToken.toString(), userRewardPerTokenPaid.toString(), rewards.toString());
        return balanceOf.mul(_rewardPerToken.sub(userRewardPerTokenPaid)).div(dec).add(rewards);
    }

    const getRewardRate = (_reward, _duration = '604800') => {
        let reward = new BN(_reward);
        let duration = new BN(_duration);
        return reward.div(duration);
    }

    const getRewardPerToken = async (_interval, _rewardRate, _poolContractObject) => {
        let totalSupply = new BN((await _poolContractObject.methods.totalSupply().call()).toString());
        let rewardPerTokenStored = new BN((await _poolContractObject.methods.rewardPerTokenStored().call()).toString());
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        let interval = new BN(_interval);
        let rewardRate = new BN(_rewardRate);
        let dec = new BN(toWei('1'));
        return rewardPerTokenStored.add(interval.mul(rewardRate).mul(dec).div(totalSupply));
    }

    beforeEach(async () => {
        let _initTotalSupply = toWei('90000000');
        this.initreward = toWei('1200000');
        // Fak Wrapped UNI LP token
        // this.IFA_sCRV = await MockERC20.new('Fake Wrapped IFA_sCRV', 'IFA_sCRV', 18, _initTotalSupply, { from: alice });
        this.sCRVLP = new web3.eth.Contract(MockERC20Json.abi, tokenAddress.sCRVLP);
        // crate iUSD token
        // let _iTokenDelegate = await iTokenDelegate.new({ from: alice });
        // this.iUSD = await iTokenDelegator.new("ifarm.finance iUSD", "iUSD", 18, _initTotalSupply, _iTokenDelegate.address, "0x", { from: alice });
        this.iUSD = new web3.eth.Contract(iTokenJson.abi, tokenAddress.iUSD);
        this.bpPool = new web3.eth.Contract(blenheimPalace.abi, tokenAddress.blenheimPalace);
        this.bpPool.address = tokenAddress.blenheimPalace;

        this.duration = '604800';
        // new deploy BlenheimPalace
        // this.reward = toWei('100000');
        // this.bpPool = await BlenheimPalace.new({ from: alice });
        // await this.iUSD.methods._setIncentivizer(this.bpPool.address).send({ from: alice });
        // await this.bpPool.setRewardDistribution(alice, { from: alice });
        // await this.bpPool.notifyRewardAmount(this.reward, { from: alice });
        // console.log(`BlenheimPalace ContractAddress: ${this.bpPool.address}`);
        // await time.increase(3600);
    });

    afterEach('init case data', async () => {
        let accounts = [alice, bob, carol];
        for (let i = 0; i < accounts.length; i++) {
            let balanceOf = await this.bpPool.methods.balanceOf(accounts[i]).call();
            if (balanceOf > 0) {
                await this.iUSD.methods.approve(this.bpPool.address, this.approveAmount).send({ from: accounts[i] });
                await this.bpPool.methods.exit().send({ from: accounts[i], gas: '3000000' });
            }
        }
    });

    context('Smoke flow testing', async () => {
        it('stake 10 ether sCRV', async () => {
            let latest = await time.latest();
            let seedAmount = toWei('10');
            let sCRVBalanceOf = {};
            let iUSDBalanceOf = {};
            sCRVBalanceOf.before = await this.sCRVLP.methods.balanceOf(bob).call();
            iUSDBalanceOf.before = await this.iUSD.methods.balanceOf(bob).call();
            await this.sCRVLP.methods.approve(this.bpPool.address, this.approveAmount).send({ from: bob });
            await this.bpPool.methods.stake(seedAmount).send({ from: bob, gas: '3000000' });
            iUSDBalanceOf.current = await this.iUSD.methods.balanceOf(bob).call();
            // sCRV LP token balanceOf
            sCRVBalanceOf.current = await this.sCRVLP.methods.balanceOf(bob).call();
            assert.equal(seedAmount, new BN(sCRVBalanceOf.before).sub(new BN(sCRVBalanceOf.current)), 'stake sCRV amount error');
        });

        it('stake 10 ether after, stake 12 ether', async () => {
            let seedAmount = toWei('10');
            let sCRVBalanceOf = {};
            sCRVBalanceOf.before = await this.sCRVLP.methods.balanceOf(bob).call();
            await this.sCRVLP.methods.approve(this.bpPool.address, this.approveAmount).send({ from: bob });
            await this.bpPool.methods.stake(seedAmount).send({ from: bob, gas: '3000000' });
            let seedAmount2 = toWei('12');
            await this.bpPool.methods.stake(seedAmount2).send({ from: bob, gas: '3000000' });
            // sCRV LP token balanceOf
            sCRVBalanceOf.current = await this.sCRVLP.methods.balanceOf(bob).call();
            let totalSeed = new BN(seedAmount).add(new BN(seedAmount2));
            let result = new BN(sCRVBalanceOf.before).sub(new BN(sCRVBalanceOf.current));
            // console.log(totalSeed.toString(), result.toString());
            assert.equal(totalSeed.toString(), result.toString(), 'stake sCRV amount error');
        });

        it('stake 10 ether sCRV and getReward', async () => {
            // let latest = await time.latest();
            let seedAmount = toWei('10');
            let sCRVBalanceOf = {};
            let iUSDBalanceOf = {};
            sCRVBalanceOf.before = await this.sCRVLP.methods.balanceOf(bob).call();
            iUSDBalanceOf.before = await this.iUSD.methods.balanceOf(bob).call();
            await this.sCRVLP.methods.approve(this.bpPool.address, this.approveAmount).send({ from: bob });
            await this.bpPool.methods.stake(seedAmount).send({ from: bob, gas: '3000000' });
            let latest = await time.latest();
            // sCRV LP token balanceOf
            sCRVBalanceOf.current = await this.sCRVLP.methods.balanceOf(bob).call();
            assert.equal(seedAmount, new BN(sCRVBalanceOf.before).sub(new BN(sCRVBalanceOf.current)), 'stake sCRV amount error');
            await time.increase(60);

            let currentLatest = await time.latest();
            let interval = currentLatest - latest;
            let rewardRate = getRewardRate(this.initreward);
            let rewardPerToken = await getRewardPerToken(interval, rewardRate, this.bpPool);
            let shouldReward = await getEarned(bob, rewardPerToken, this.bpPool);
            await this.bpPool.methods.getReward().send({ from: bob, gas: '300000' });

            iUSDBalanceOf.current = await this.iUSD.methods.balanceOf(bob).call();
            let iUSDReward = new BN(iUSDBalanceOf.current).sub(new BN(iUSDBalanceOf.before));
            // console.log(shouldReward.toString(), iUSDReward.toString());
            assert.equal(shouldReward.toString(), iUSDReward.toString(), 'reward amount error');
        });

        it('stake 10 ether after, stake 12 ether and getReward', async () => {
            let latest = await time.latest();
            let seedAmount = toWei('10');
            let iUSDBalanceOf = {};
            iUSDBalanceOf.before = await this.iUSD.methods.balanceOf(bob).call();
            await this.sCRVLP.methods.approve(this.bpPool.address, this.approveAmount).send({ from: bob });
            let currentLatest = await time.latest();

            let interval = currentLatest - latest;
            let rewardRate = getRewardRate(this.initreward);
            let rewardPerToken = await getRewardPerToken(interval, rewardRate, this.bpPool);
            let shouldReward = await getEarned(bob, rewardPerToken, this.bpPool);
            await this.bpPool.methods.stake(seedAmount).send({ from: bob, gas: '3000000' });

            let seedAmount2 = toWei('12');
            latest = await time.latest();
            await this.bpPool.methods.stake(seedAmount2).send({ from: bob, gas: '3000000' });
            await time.increase(60);
            currentLatest = await time.latest();
            await this.bpPool.methods.getReward().send({ from: bob, gas: '300000' });

            interval = currentLatest - latest;
            rewardRate = getRewardRate(this.initreward);
            rewardPerToken = await getRewardPerToken(interval, rewardRate, this.bpPool);
            shouldReward = shouldReward.add(await getEarned(bob, rewardPerToken, this.bpPool));
            iUSDBalanceOf.current = await this.iUSD.methods.balanceOf(bob).call();
            let reward = new BN(iUSDBalanceOf.current).sub(new BN(iUSDBalanceOf.before));
            assert.equal(shouldReward.toString(), reward.toString(), 'reward amount error');
        });

        it('stake 10 ether sCRV and getReward before exit', async () => {
            let seedAmount = toWei('10');
            let iUSDBalanceOf = {};
            let poolBalanceOf = {};
            poolBalanceOf.before = await this.bpPool.methods.balanceOf(bob).call();
            iUSDBalanceOf.before = await this.iUSD.methods.balanceOf(bob).call();
            await this.sCRVLP.methods.approve(this.bpPool.address, this.approveAmount).send({ from: bob });
            await this.bpPool.methods.stake(seedAmount).send({ from: bob, gas: '3000000' });
            let latest = await time.latest();

            // get reward
            await time.increase(60);
            let currentLatest = await time.latest();

            let interval = currentLatest - latest;
            let rewardRate = getRewardRate(this.initreward);
            let rewardPerToken = await getRewardPerToken(interval, rewardRate, this.bpPool);
            let shouldReward = await getEarned(bob, rewardPerToken, this.bpPool);

            await this.bpPool.methods.getReward().send({ from: bob, gas: '300000' });
            iUSDBalanceOf.current = await this.iUSD.methods.balanceOf(bob).call();
            let iUSDReward = new BN(iUSDBalanceOf.current).sub(new BN(iUSDBalanceOf.before));
            assert.equal(shouldReward.toString(), iUSDReward.toString(), 'get iUSD Reward amount error');

            // exit reward
            latest = await time.latest();
            await time.increase(60);
            currentLatest = await time.latest();
            interval = currentLatest - latest;
            rewardRate = getRewardRate(this.initreward);
            rewardPerToken = await getRewardPerToken(interval, rewardRate, this.bpPool);
            shouldReward = shouldReward.add(await getEarned(bob, rewardPerToken, this.bpPool));
            await this.bpPool.methods.exit().send({ from: bob, gas: '3000000' });

            iUSDBalanceOf.current = await this.iUSD.methods.balanceOf(bob).call();
            iUSDReward = new BN(iUSDBalanceOf.current).sub(new BN(iUSDBalanceOf.before));
            assert.equal(shouldReward.toString(), iUSDReward.toString(), 'exit iUSD reward amount error');
        });


    });

    context('Withdraw part of the deposit', async () => {

    });

});
