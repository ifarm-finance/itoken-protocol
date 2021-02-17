const { time } = require('@openzeppelin/test-helpers');
const { getDeployedContract } = require("./config/contract_address")
const BN = web3.utils.BN;
// ============ Contracts ============
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");

// load deployed contract address
const DeployedContract = getDeployedContract()

const tokens = {
    'DAI': DeployedContract.tokensAddress.DAI,
    'wBTC': DeployedContract.tokensAddress.wBTC,
    'wETH': DeployedContract.tokensAddress.wETH,
    'iUSD': DeployedContract.itokensAddress.iUSD,
    'iBTC': DeployedContract.itokensAddress.iBTC,
    'iETH': DeployedContract.itokensAddress.iETH,
}

const uniswap = {
    'uniswapFactory': DeployedContract.uniswapsAddress.uniswapV2Factory,
    'uniswapV2Router': DeployedContract.uniswapsAddress.uniswapV2Router,
}

let contractAddress = {}

// ============ Main Migration ============
const migration = async (deployer, network) => {
    // console.log(tokens.DAI);
    // return
    await Promise.all([
        await deployiUSDRebaser(deployer),
        // await deployiBTCRebaser(deployer),
        // await deployiETHRebaser(deployer),
    ]);
    // await initContract();
    console.log(JSON.parse(contractAddress));
};

module.exports = migration;

// ============ Deploy Functions ============
async function deployiUSDRebaser(deployer) {
    let DAIReserver = await Reserves.new(tokens.DAI, tokens.iUSD);
    console.log(`uniswap.uniswapFactory:${uniswap.uniswapFactory}`)
    console.log(`token address: ${tokens.iUSD},${tokens.DAI}`)
    this.iUSDRebaser = await Rebaser.new(tokens.iUSD, tokens.DAI, uniswap.uniswapFactory, DAIReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iUSDRebaser'] = this.iUSDRebaser.address;
    contractAddress['iUSDReserves'] = DAIReserver.address;
    await DAIReserver._setRebaser(this.iUSDRebaser.address);
    let uniswap_pair = await this.iUSDRebaser.uniswap_pair();
    console.log(`${uniswap_pair}`);
    await this.iUSDRebaser.init_twap();
}

async function deployiBTCRebaser(deployer) {
    let wBTCReserver = await Reserves.new(tokens.wBTC, tokens.iBTC);
    this.iBTCRebaser = await Rebaser.new(tokens.wBTC, tokens.iBTC, uniswap.uniswapFactory, wBTCReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iBTCRebaser'] = this.iBTCRebaser.address;
    contractAddress['iBTCReserves'] = wBTCReserver.address;
    await wBTCReserver._setRebaser(this.iBTCRebaser.address);
    await this.iBTCRebaser.init_twap();
}

async function deployiETHRebaser(deployer) {
    let wETHReserver = await Reserves.new(tokens.wETH, tokens.iETH);
    this.iETHRebaser = await Rebaser.new(tokens.wETH, tokens.iETH, uniswap.uniswapFactory, wETHReserver.address, '0x0000000000000000000000000000000000000000', 0);
    contractAddress['iETHRebaser'] = this.iETHRebaser.address;
    contractAddress['iETHReserves'] = wETHReserver.address;
    await wETHReserver._setRebaser(this.iETHRebaser.address);
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