const { time } = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;
// ============ Contracts ============
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");
const DAIReserver = wBTCReserver = wETHReserver = Reserves
const iUSDRebaser = iBTCRebaser = iETHRebaser = Rebaser

const tokens = {
    'DAI': '0x09d907643CdC2B07E6898BD8bBF9ab2106394265',
    'wBTC': '0x70cB6129b85449cdbb5d89F8cD65aA5752B638A5',
    'wETH': '0x7A530768CddbBB3FE9Ac7D7A174aAF44922af19d',
    'iUSD': '0x5C06F3eB9cF03D026ED7D7e8eA2c0F2a02A30052',
    'iBTC': '0x638D8bc5cB98194c90DECF8aA6Faf10403b45C0A',
    'iETH': '0x600B3132Bb97aA7D1D6bE574e8a4AF693A959dAF',
}

const uniswap = {
    'uniswapFactory': '0x01E396fC2b6681f6891820584a240AAecab8637C',
    'uniswapV2Router': '0x92c8bE7C2e3dCF17B587bD4a7Bb84Ca6219E27c3',
}

let rebaserContract = {
    "iUSDRebaser": '0x8ac26F68Df7ABB5BF722475b318b908BD4117d1E',
    "iBTCRebaser": '0x311577f4a4d526f3e582cEc842535D19CD746A84',
    "iETHRebaser": '0x7e6eEc479A12889E62E85aD5af7729E2dD4Df4eE'
}
1000000000000000000
10000000000000000000000000
1000000000000000000000000
10000000000000000000000000000000

let contractAddress = {}

// ============ Main Migration ============
const migration = async (deployer, network) => {
    await Promise.all([
        deployiUSDRebaser(deployer),
        deployiBTCRebaser(deployer),
        deployiETHRebaser(deployer),
    ]);
    console.log(contractAddress);
};

module.exports = migration;

// ============ Deploy Functions ============
async function deployiUSDRebaser(deployer) {
    await deployer.deploy(DAIReserver, tokens.DAI, tokens.iUSD);
    // await deployer.deploy(iUSDRebaser, tokens.DAI, tokens.iUSD, uniswap.uniswapFactory, DAIReserver.address, '0x0000000000000000000000000000000000000000', 0);
    let rebaser = await iUSDRebaser.new(tokens.DAI, tokens.iUSD, uniswap.uniswapFactory, DAIReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iUSDRebaser'] = rebaser.address;
    await rebaser.init_twap();
    let init_twap = await rebaser.timeOfTWAPInit();
    // now blocktime >=  init_twap + rebaseDelay(1 days)
    let incrementToTime = new BN(init_twap).add(new BN('86400')).toNumber();
    // 24 hours before activate rebasing
    time.increaseTo(incrementToTime);
    await rebaser.activate_rebasing();
}

async function deployiBTCRebaser(deployer) {
    await deployer.deploy(wBTCReserver, tokens.wBTC, tokens.iBTC);
    // await deployer.deploy(iBTCRebaser, tokens.wBTC, tokens.iBTC, uniswap.uniswapFactory, wBTCReserver.address, '0x0000000000000000000000000000000000000000', 0);
    // let rebaser = await iBTCRebaser.deployed();
    let rebaser = await iBTCRebaser.new(tokens.wBTC, tokens.iBTC, uniswap.uniswapFactory, wBTCReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iBTCRebaser'] = rebaser.address;
    await rebaser.init_twap();
    let init_twap = await rebaser.timeOfTWAPInit();
    // now blocktime >=  init_twap + rebaseDelay(1 days)
    let incrementToTime = new BN(init_twap).add(new BN('86400')).toNumber();
    // 24 hours before activate rebasing
    time.increaseTo(incrementToTime);
    await rebaser.activate_rebasing();
}

async function deployiETHRebaser(deployer) {
    await deployer.deploy(wETHReserver, tokens.wETH, tokens.iETH);
    // await deployer.deploy(iETHRebaser, tokens.wETH, tokens.iETH, uniswap.uniswapFactory, wETHReserver.address, '0x0000000000000000000000000000000000000000', 0);
    // let rebaser = await iETHRebaser.deployed();
    let rebaser = await iETHRebaser.new(tokens.wETH, tokens.iETH, uniswap.uniswapFactory, wETHReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iETHRebaser'] = rebaser.address;
    await rebaser.init_twap();
    let init_twap = await rebaser.timeOfTWAPInit();
    // now blocktime >=  init_twap + rebaseDelay(1 days)
    let incrementToTime = new BN(init_twap).add(new BN('86400')).toNumber();
    // 24 hours before activate rebasing
    time.increaseTo(incrementToTime);
    await rebaser.activate_rebasing();
}