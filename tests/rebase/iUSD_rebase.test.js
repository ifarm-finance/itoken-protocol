const { expectRevert, time } = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;
const ether = (amount) => { return web3.utils.toWei(`${amount}`) };
const now = () => { return Math.floor((new Date()).getTime() / 1000) };
const path = require('path');
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");

const basedir = path.dirname(path.dirname(__dirname));
const contractJsonPath = path.join(basedir, 'build/contracts');

const iTokenJson = require(path.join(contractJsonPath, 'iTokenDelegator.json'))
const mockERC20Json = require(path.join(contractJsonPath, 'MockERC20.json'))
const uniswapRouterAbi = require('../lib/uniR.json');
const uniswapFactoryAbi = require('../lib/unifact2.json');
const uniswapPairAbi = require('../lib/uni2.json');
const { increaseTo } = require('@openzeppelin/test-helpers/src/time');


const contractsAddress = {
    'iETH': "0x600B3132Bb97aA7D1D6bE574e8a4AF693A959dAF",
    'wETH': '0x7A530768CddbBB3FE9Ac7D7A174aAF44922af19d',
    'iUSD': '0x5C06F3eB9cF03D026ED7D7e8eA2c0F2a02A30052',
    'sCRV': '0x6BF1DbEcccd5F3a4d57beC45E9eA3e5f7edc9e7d',
    'uniswapFactory': '0x37E28138E834fACDfA82aDc20cC2FCa23f196559',
    'uniswapV2Router': "0xE38076A58598538D2365696E2e74D1F8247E8319",
    'pair': '',
    'publicGoods': '0x0000000000000000000000000000000000000000'
}

const oneEther = '1000000000000000000'
const maxApprove = '100000000000000000000000000'

contract('iUSD Rebase', async ([alice, bob, carol, breeze]) => {
    before(async () => {
        this.iUSD = new web3.eth.Contract(iTokenJson.abi, contractsAddress.iUSD);
        this.sCRV = new web3.eth.Contract(mockERC20Json.abi, contractsAddress.sCRV);
        this.uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, contractsAddress.uniswapV2Router);
        this.uniswapFactory = new web3.eth.Contract(uniswapFactoryAbi, contractsAddress.uniswapFactory);
        contractsAddress.pair = await this.uniswapFactory.methods.getPair(contractsAddress.iUSD, contractsAddress.sCRV).call();
        this.uniswapPair = new web3.eth.Contract(uniswapPairAbi, contractsAddress.pair);
        this.reserve = await Reserves.new(contractsAddress.sCRV, contractsAddress.iUSD, { from: alice });
        this.rebaser = await Rebaser.new(contractsAddress.iUSD, contractsAddress.sCRV, contractsAddress.uniswapFactory, this.reserve.address, contractsAddress.publicGoods, 0, { from: alice });
        // iUSD approve
        await this.iUSD.methods.approve(contractsAddress.uniswapV2Router, maxApprove).send({ from: alice, gas: 3000000 });
        await this.iUSD.methods.approve(this.rebaser.address, maxApprove).send({ from: alice, gas: 3000000 });
        await this.iUSD.methods.approve(contractsAddress.uniswapFactory, maxApprove).send({ from: alice, gas: 3000000 });
        // sCRV approve
        await this.sCRV.methods.approve(contractsAddress.uniswapV2Router, maxApprove).send({ from: alice, gas: 3000000 });
        await this.sCRV.methods.approve(this.rebaser.address, maxApprove).send({ from: alice, gas: 3000000 });
        await this.sCRV.methods.approve(contractsAddress.uniswapFactory, maxApprove).send({ from: alice, gas: 3000000 });
        // pair approve
        await this.uniswapPair.methods.approve(contractsAddress.uniswapV2Router, maxApprove).send({ from: alice, gas: 3000000 });
        await this.uniswapPair.methods.approve(contractsAddress.uniswapFactory, maxApprove).send({ from: alice, gas: 3000000 });
        // iUSD init rebase contract address
        await this.iUSD.methods._setRebaser(this.rebaser.address).send({ from: alice, gas: 3000000 });

        this.amountDesiredIUSD = ether(100);
        this.amountDesiredSCRV = ether(100);

        // init twap
        await this.rebaser.init_twap({ from: alice });
        let init_twap = await this.rebaser.timeOfTWAPInit();
        let priceCumulativeLast = await this.rebaser.priceCumulativeLast();

        // activate rebasing
        // now blocktime >=  init_twap + rebaseDelay(1 days)
        let incrementToTime = new BN(init_twap).add(new BN('86400')).toNumber();
        // 24 hours before activate rebasing
        time.increaseTo(incrementToTime);
        await this.rebaser.activate_rebasing({ from: alice });

        // public function
        this.addLiquidity = async (amountADesired, amountBDesired, to) => {
            let reserves = await this.uniswapPair.methods.getReserves().call();

            let amountA = amountADesired;
            let amountB = amountBDesired;
            let amountAMin = new BN(amountADesired).sub(new BN(1));
            let amountBMin = new BN(amountBDesired).sub(new BN(1));
            if (reserves[0] != 0 && reserves[1] != 0) {
                amountA = amountADesired;
                amountB = await this.uniswapRouter.methods.quote(amountA, reserves[0], reserves[1]).call();
                amountAMin = new BN(amountA).sub(new BN(1)).toString();
                amountBMin = new BN(amountB).sub(new BN(1)).toString();
            }
            let deadline = new BN(await time.latest()).add(new BN('3600')).toNumber();
            await this.uniswapRouter.methods.addLiquidity(
                contractsAddress.iUSD,
                contractsAddress.sCRV,
                amountA,
                amountB,
                amountAMin,
                amountBMin,
                to,
                deadline
            ).send({ from: to, gas: 6000000 });
        }

        this.swapExactTokensForTokens = async (inToken, amountIn, outToken, to) => {
            let deadline = new BN(await time.latest()).add(new BN('3600')).toNumber();
            let reserves = await this.uniswapPair.methods.getReserves().call();
            let token0 = inToken < outToken ? inToken : outToken;
            let token1 = outToken > inToken ? outToken : inToken;
            let reserveIn = inToken == token0 ? reserves[0] : reserves[1];
            let reserveOut = outToken == token1 ? reserves[1] : reserves[0];
            let amountOut = await this.uniswapRouter.methods.getAmountOut(amountIn, reserveIn, reserveOut)
                .call({ from: to, gas: 600000 });

            await this.uniswapRouter.methods.swapExactTokensForTokens(
                amountIn,
                amountOut,
                [inToken, outToken],
                to,
                deadline
            ).send({ from: to, gas: 6000000 });
        }

        this.removeAllLiquidity = async (tokenA, tokenB, to) => {
            let reserves = await this.uniswapPair.methods.getReserves().call();
            let amountAOptimal = await this.uniswapRouter.methods.quote(ether(1), reserves[0], reserves[1]).call();
            let amountBOptimal = await this.uniswapRouter.methods.quote(ether(1), reserves[0], reserves[1]).call();
            let pairBalanceOf = await this.uniswapPair.methods.balanceOf(alice).call();
            let liquidityAmount = pairBalanceOf;
            let deadline = new BN(await time.latest()).add(new BN('3600')).toNumber();
            await this.uniswapRouter.methods.removeLiquidity(
                tokenA,
                tokenB,
                liquidityAmount,
                1,
                1,
                to,
                deadline
            ).send({ from: to, gas: 6000000 });
        }

        this.rebaserInfo = async () => {
            let mainTarget = {};
            mainTarget.sCRVReserves = await this.sCRV.methods.balanceOf(this.reserve.address).call();
            mainTarget.iUSDReserves = await this.iUSD.methods.balanceOf(this.reserve.address).call();
            mainTarget.treasury = new BN(mainTarget.sCRVReserves).add(new BN(mainTarget.iUSDReserves)).toString();
            mainTarget.targetPrice = (await this.rebaser.targetRate()).toString();
            mainTarget.maxSlippageFactor = (await this.rebaser.maxSlippageFactor()).toString();
            mainTarget.currentPrice = (await this.rebaser.getCurrentTWAP({ from: alice })).toString();
            mainTarget.formatCurrentPrice = mainTarget.currentPrice / oneEther;
            mainTarget.lastRebaseTimestampSec = (await this.rebaser.lastRebaseTimestampSec()).toString();
            mainTarget.rebaseLag = (await this.rebaser.rebaseLag()).toString();
            return mainTarget;
        }

    });

    beforeEach(async () => {
        // before each case
    });

    after(async () => {
        // remove liquidity, return iUSD amount and sCRV amount
        await this.removeAllLiquidity(contractsAddress.iUSD, contractsAddress.sCRV, alice);
    });

    afterEach(async () => {
        // after each case
        console.log('------- afterEach --------')
        // console.log(await this.rebaserInfo());
    });

    context('Main business scenarios', async () => {
        it('init params value', async () => {
        });

        it.only('positive rebasing', async () => {
            console.log(await this.rebaserInfo());
            // 8 hours (28800 sec)
            let offSetSec = new BN(await this.rebaser.rebaseWindowOffsetSec());
            // 12 hours(43200 sec)
            let intervalSec = new BN(await this.rebaser.minRebaseTimeIntervalSec());
            // 1 hours (3600 sec)
            let windowLengthSec = new BN(await this.rebaser.rebaseWindowLengthSec());
            let reserves = await this.uniswapPair.methods.getReserves().call();
            let amountADesired = ether(100);
            let amountBDesired = ether(100);
            let amountAOptimal = await this.uniswapRouter.methods.quote(amountADesired, reserves[0], reserves[1]).call();
            let amountBOptimal = await this.uniswapRouter.methods.quote(amountBDesired, reserves[0], reserves[1]).call();
            let now = new BN(await time.latest());
            let incrementToTime = now;
            // 12 hours per cycle
            let currentOffSetSec = now.mod(intervalSec);
            if (currentOffSetSec.toNumber() >= (9 * 3600)) {
                // next 12 hours cycle
                incrementToTime = new BN(12 * 3600).sub(currentOffSetSec).add(incrementToTime).add(offSetSec).add(new BN(10));
            } else {
                incrementToTime = currentOffSetSec.toNumber() < (8 * 3600)
                    ? incrementToTime.sub(currentOffSetSec).add(offSetSec).add(new BN(10))
                    : incrementToTime.add(new BN(10));
            }
            await this.addLiquidity(ether(1000), ether(100), alice);
            reserves = await this.uniswapPair.methods.getReserves().call();
            console.log(reserves);
            await this.swapExactTokensForTokens(contractsAddress.sCRV, ether(100), contractsAddress.iUSD, alice);
            await this.swapExactTokensForTokens(contractsAddress.sCRV, ether(200), contractsAddress.iUSD, alice);
            // await this.swapExactTokensForTokens(contractsAddress.iUSD, ether(100), contractsAddress.sCRV, alice);
            // await this.swapExactTokensForTokens(contractsAddress.iUSD, ether(200), contractsAddress.sCRV, alice);

            let info = await this.rebaserInfo();
            console.log(info);

            await increaseTo(incrementToTime.toNumber());
            await this.rebaser.rebase({ from: alice });
            await time.increase(10);
            reserves = await this.uniswapPair.methods.getReserves().call();
            console.log(reserves);
            info = await this.rebaserInfo();
            console.log(info);
        })
    });
});
