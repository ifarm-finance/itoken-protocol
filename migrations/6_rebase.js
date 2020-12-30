const { time } = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;
// ============ Contracts ============
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");
const DAIReserver = wBTCReserver = wETHReserver = Reserves
const iUSDRebaser = iBTCRebaser = iETHRebaser = Rebaser

const tokens = {
    'DAI': '0xe5737F0f694897331FE28640D2164B1404F23Dc0',
    'wBTC': '0xe65b25FE4bec1F5aC9364304a175d68b582f5d0a',
    'wETH': '0x9004529746a3d2496E46248929a3a57Cd30B0d0f',
    'iUSD': '0xB178B47afbc33BDd036D178E4F48d3086e3beFF5',
    'iBTC': '0x80C97D1A9f8281727A63e5e8588095D35aAfaB4a',
    'iETH': '0xc257BCf9EEEbC727C14BA4451298ec70534540eC',
}

const uniswap = {
    'uniswapFactory': '0xBBa9c67e95e3D997a8Af1D1AB0A0b5076A60BAB2',
    'uniswapV2Router': '0xDbA9FC3A3f07a2b9d085C78CE488b9D145430ECc',
}

let rebaserContract = {
    "iUSDRebaser": '0x6e0F2d069D560AAE6a1f0D2C75d81c2A140D95E7',
    "iBTCRebaser": '0x07a7bD7D4A44618d229C25B9E3630F19eCE9bcAd',
    "iETHRebaser": '0x645f5D578EB1F36601443Ed1821093FAf639E1f5'
}
// 1000000000000000000
// 10000000000000000000000000
// '1000000000000000000000000'
// 10000000000000000000000000000000
// 0xDbA9FC3A3f07a2b9d085C78CE488b9D145430ECc,10000000000000000000000000000000
// 119999999663818000000
// 10000000000000000000
let contractAddress = {}

// ============ Main Migration ============
const migration = async (deployer, network) => {
    await Promise.all([
        await deployiUSDRebaser(deployer),
        await deployiBTCRebaser(deployer),
        await deployiETHRebaser(deployer),
    ]);
    // await initContract();
    console.log(contractAddress);
};

module.exports = migration;

// ============ Deploy Functions ============
async function deployiUSDRebaser(deployer) {
    let DAIReserver = await Reserves.new(tokens.DAI, tokens.iUSD);
    // await deployer.deploy(DAIReserver, tokens.DAI, tokens.iUSD);
    // await deployer.deploy(iUSDRebaser, tokens.DAI, tokens.iUSD, uniswap.uniswapFactory, DAIReserver.address, '0x0000000000000000000000000000000000000000', 0);
    this.iUSDRebaser = await Rebaser.new(tokens.DAI, tokens.iUSD, uniswap.uniswapFactory, DAIReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iUSDRebaser'] = this.iUSDRebaser.address;
    contractAddress['iUSDReserves'] = DAIReserver.address;
    await this.iUSDRebaser.init_twap();
}

async function deployiBTCRebaser(deployer) {
    let wBTCReserver = await Reserves.new(tokens.wBTC, tokens.iBTC);
    // await deployer.deploy(wBTCReserver, tokens.wBTC, tokens.iBTC);
    // await deployer.deploy(iBTCRebaser, tokens.wBTC, tokens.iBTC, uniswap.uniswapFactory, wBTCReserver.address, '0x0000000000000000000000000000000000000000', 0);
    // let rebaser_ = await iBTCRebaser.deployed();
    this.iBTCRebaser = await Rebaser.new(tokens.wBTC, tokens.iBTC, uniswap.uniswapFactory, wBTCReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iBTCRebaser'] = this.iBTCRebaser.address;
    contractAddress['iBTCReserves'] = wBTCReserver.address;
    await this.iBTCRebaser.init_twap();
}

async function deployiETHRebaser(deployer) {
    let wETHReserver = await Reserves.new(tokens.wETH, tokens.iETH);
    // await deployer.deploy(wETHReserver, tokens.wETH, tokens.iETH);
    // await deployer.deploy(iETHRebaser, tokens.wETH, tokens.iETH, uniswap.uniswapFactory, wETHReserver.address, '0x0000000000000000000000000000000000000000', 0);
    // let rebaser_ = await iETHRebaser.deployed();
    this.iETHRebaser = await Rebaser.new(tokens.wETH, tokens.iETH, uniswap.uniswapFactory, wETHReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iETHRebaser'] = this.iETHRebaser.address;
    contractAddress['iETHReserves'] = wETHReserver.address;
    await this.iETHRebaser.init_twap();
}

async function initContract() {
    await time.increase('86400');
    // iUSD
    await this.iUSDRebaser.activate_rebasing();
    // iBTC
    await this.iBTCRebaser.activate_rebasing();
    // iETH
    await this.iETHRebaser.activate_rebasing();
}