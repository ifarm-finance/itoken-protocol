const { expectRevert, time } = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;
const ether = (amount) => { return web3.utils.toWei(`${amount}`) };
const nowSysTime = () => { return Math.floor((new Date()).getTime() / 1000) };
const path = require('path');
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");
const { newContractAt, newContract } = require('../lib/ContractAction');

const basedir = path.dirname(path.dirname(__dirname));
const contractJsonPath = path.join(basedir, 'build/contracts');
const contractBytecodePath = path.join(basedir, 'tests/lib/bytecode')

const iTokenJson = require(path.join(contractJsonPath, 'iTokenDelegator.json'))
const mockERC20Json = require(path.join(contractJsonPath, 'MockERC20.json'))
const uniswapRouterAbi = require('../lib/uniR.json');
const uniswapFactoryAbi = require('../lib/unifact2.json');
const uniswapPairAbi = require('../lib/uni2.json');
const { increaseTo } = require('@openzeppelin/test-helpers/src/time');

const uniswapFactoryBytecode = require(path.join(contractBytecodePath, 'UniswapV2Factory.json'))
const uniswapRouterBytecode = require(path.join(contractBytecodePath, 'UniswapV2Router02.json'))

const contractsAddress = {
    'iETH': "0x600B3132Bb97aA7D1D6bE574e8a4AF693A959dAF",
    'wETH': '0x7A530768CddbBB3FE9Ac7D7A174aAF44922af19d',
    'iUSD': '0x5C06F3eB9cF03D026ED7D7e8eA2c0F2a02A30052',
    'sCRV': '0x6BF1DbEcccd5F3a4d57beC45E9eA3e5f7edc9e7d',
    'uniswapFactory': '0x01E396fC2b6681f6891820584a240AAecab8637C',
    'uniswapV2Router': "0x92c8bE7C2e3dCF17B587bD4a7Bb84Ca6219E27c3",
    'pair': '0xc45d9b07eaDBDb54c88E3363F02d6B908abb3e82',
    'publicGoods': '0x0000000000000000000000000000000000000000'
}

const oneEther = '1000000000000000000'
const maxApprove = '100000000000000000000000000'

contract('iUSD Rebase', async ([alice, bob, carol, breeze]) => {
    before(async () => {
        this.iUSD = new web3.eth.Contract(iTokenJson.abi, contractsAddress.iUSD);
        this.sCRV = new web3.eth.Contract(mockERC20Json.abi, contractsAddress.sCRV);
        this.iETH = new web3.eth.Contract(iTokenJson.abi, contractsAddress.iETH)
        this.wETH = new web3.eth.Contract(mockERC20Json.abi, contractsAddress.wETH);
        this.uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, contractsAddress.uniswapV2Router);
        this.uniswapFactory = new web3.eth.Contract(uniswapFactoryAbi, contractsAddress.uniswapFactory);
        // this.uniswapFactory = await newContract.UniswapV2Factory(alice, [alice]);
        // this.uniswapFactory.address = this.uniswapFactory.options.address;
        // this.uniswapRouter = await newContract.UniswapV2Router02(alice, [this.uniswapFactory.address, contractsAddress.wETH]);
        // await this.uniswapFactory.methods.createPair(contractsAddress.iUSD, contractsAddress.sCRV).send({ from: alice, gas: 6000000 });
        // contractsAddress.uniswapV2Router = this.uniswapRouter.options.address;
        // contractsAddress.uniswapFactory = this.uniswapFactory.address;

        contractsAddress.pair = await this.uniswapFactory.methods.getPair(contractsAddress.iUSD, contractsAddress.sCRV).call();

        this.uniswapPair = new web3.eth.Contract(uniswapPairAbi, contractsAddress.pair);

        this.reserve = await Reserves.new(contractsAddress.sCRV, contractsAddress.iUSD, { from: alice });
        this.rebaser = await Rebaser.new(contractsAddress.iUSD, contractsAddress.sCRV, contractsAddress.uniswapFactory, this.reserve.address, contractsAddress.publicGoods, 0, { from: alice });

        // all token approve
        let tokens = [this.iUSD, this.sCRV, this.iETH, this.wETH];
        for (let i = 0; i < tokens.length; i++) {
            await tokens[i].methods.approve(contractsAddress.uniswapV2Router, maxApprove).send({ from: alice, gas: 3000000 });
            await tokens[i].methods.approve(contractsAddress.uniswapFactory, maxApprove).send({ from: alice, gas: 3000000 });
            await tokens[i].methods.approve(this.rebaser.address, maxApprove).send({ from: alice, gas: 3000000 });
        }

        // pair approve
        await this.uniswapPair.methods.approve(contractsAddress.uniswapV2Router, maxApprove).send({ from: alice, gas: 3000000 });
        await this.uniswapPair.methods.approve(contractsAddress.uniswapFactory, maxApprove).send({ from: alice, gas: 3000000 });
        // iUSD init rebase contract address
        await this.iUSD.methods._setRebaser(this.rebaser.address).send({ from: alice, gas: 3000000 });

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
                contractsAddress.iETH,
                contractsAddress.wETH,
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

        // addliquidity
        // await this.addLiquidity(ether(2000), ether(200), alice);
        // await this.swapExactTokensForTokens(contractsAddress.sCRV, ether(120), contractsAddress.iUSD, alice);

        // internal Next Rebase timestamp
        this.internalNextRebase = async () => {
            let nowBlockTime = new BN(await time.latest());
            // 12 hours past how much sec
            let past = nowBlockTime.mod(this.intervalSec);
            if (past >= this.offSetSec.add(this.windowLengthSec)) {
                return this.offSetSec.add(this.intervalSec.sub(past))
            }
            if (past < this.offSetSec) {
                return this.offSetSec.sub(past);
            } else {
                return new BN(0);
            }
        }

        // init rebase settings
        // 8 hours (28800 sec)
        this.offSetSec = new BN(28800);
        // 12 hours(43200 sec)
        this.intervalSec = new BN(43200);
        // 1 hours (3600 sec)
        this.windowLengthSec = new BN(3600);

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

        this.rebaserInfo = async () => {
            let reserves = await this.uniswapPair.methods.getReserves().call();
            let mainTarget = {};
            mainTarget.sCRVReserves = await this.sCRV.methods.balanceOf(this.reserve.address).call();
            mainTarget.iUSDReserves = await this.iUSD.methods.balanceOf(this.reserve.address).call();
            mainTarget.uniswapReserves0 = reserves[0];
            mainTarget.uniswapReserves1 = reserves[1];
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

    });

    afterEach(async () => {
        // after each case
        // remove liquidity, return iUSD amount and sCRV amount
        let accounts = [alice, bob, carol, breeze]
        for (let i = 0; i < accounts.length; i++) {
            let account = accounts[i]
            let liquidity = await this.uniswapPair.methods.balanceOf(account).call();
            if (liquidity > 0) {
                await this.removeAllLiquidity(contractsAddress.iETH, contractsAddress.wETH, account);
            }
        }
    });

    context('Main business scenarios', async () => {
        it('positive rebasing', async () => {
            await this.addLiquidity(ether(2000), ether(20), alice);
            await this.swapExactTokensForTokens(contractsAddress.wETH, ether(2), contractsAddress.iETH, alice);
            await this.swapExactTokensForTokens(contractsAddress.wETH, ether(3), contractsAddress.iETH, alice);
            console.log(`rebase before info:\n`, await this.rebaserInfo());

            let internalNextRebase = await this.internalNextRebase()
            await time.increase(internalNextRebase.toNumber());
            await this.rebaser.rebase();

            await time.increase(10);
            console.log(`rebase after info:\n`, await this.rebaserInfo());
        })

        it.skip('negative rebasing', async () => {
            let lastRebaseTimestampSec = await this.rebaser.lastRebaseTimestampSec()
            let incrementToTime = new BN(lastRebaseTimestampSec).add(new BN(12 * 3600));

            await this.addLiquidity(ether(20000), ether(2000), alice);
            await this.swapExactTokensForTokens(contractsAddress.iUSD, ether(20), contractsAddress.sCRV, alice);
            await this.swapExactTokensForTokens(contractsAddress.iUSD, ether(20), contractsAddress.sCRV, alice);
            console.log(`rebase before info:\n`, await this.rebaserInfo());

            await increaseTo(incrementToTime.toNumber());
            await this.rebaser.rebase();

            await time.increase(10);
            console.log(`rebase after info:\n`, await this.rebaserInfo());
        });
    });
});
