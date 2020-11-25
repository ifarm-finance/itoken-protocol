const { time } = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;
// ============ Contracts ============
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");

const tokens = {
    'sCRV': '0x6BF1DbEcccd5F3a4d57beC45E9eA3e5f7edc9e7d',
    'btcCRV': '',
    'wETH': '0x7A530768CddbBB3FE9Ac7D7A174aAF44922af19d',
    'iUSD': '0x5C06F3eB9cF03D026ED7D7e8eA2c0F2a02A30052',
    'iBTC': '',
    'iETH': '0x600B3132Bb97aA7D1D6bE574e8a4AF693A959dAF',
}

const uniswap = {
    'uniswapFactory': '0x01E396fC2b6681f6891820584a240AAecab8637C',
    'uniswapV2Router': '0x92c8bE7C2e3dCF17B587bD4a7Bb84Ca6219E27c3',
}

// ============ Main Migration ============
const migration = async (deployer, network) => {
    await Promise.all([
        deployRebaser(deployer, tokens.sCRV, tokens.iUSD),
        // deployRebaser(deployer, tokens.btcCRV, tokens.iBTC),
        deployRebaser(deployer, tokens.wETH, tokens.iETH),
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============
async function deployRebaser(deployer, token, itoken) {
    await deployer.deploy(Reserves, token, itoken);
    await deployer.deploy(Rebaser, token, itoken, uniswap.uniswapFactory, Reserves.address, '0x0000000000000000000000000000000000000000', 0);
    let rebaser = await Rebaser.deployed();
    // init twap
    await rebaser.init_twap();
    let init_twap = await rebaser.timeOfTWAPInit();

    // activate rebasing
    // now blocktime >=  init_twap + rebaseDelay(1 days)
    let incrementToTime = new BN(init_twap).add(new BN('86400')).toNumber();
    // 24 hours before activate rebasing
    time.increaseTo(incrementToTime);
    await rebaser.activate_rebasing();
}