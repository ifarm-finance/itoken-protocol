// ============ Contracts ============

// Content:
// 1. iUSDRebaser & iUSDReserve
// 2. iETHRebaser & iETHReserve
// 3. iBTCRebaser & iBTCReserve

let fs = require('fs');
// Token
// deployed first
const iTokenImplementation = artifacts.require("iTokenDelegate");
const iTokenProxy = artifacts.require("iTokenDelegator");

// Reserves
// deployed second
const iTokenReserves = artifacts.require("iTokenReserves");
const iTokenRebaser = artifacts.require("iTokenRebaser");

const iBTCImplementation = iETHImplementation = iUSDImplementation = iTokenImplementation;
const iBTCProxy = iETHProxy = iUSDProxy = iTokenProxy;

const iBTCReserves = iETHReserves = iUSDReserves = iTokenReserves;
const iBTCRebaser = iETHRebaser = iUSDRebaser = iTokenRebaser;


// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    // when deploy rebasers and itoken reserves, it should be unannotated
    await Promise.all([
        deployiBTCRs(deployer, network), deployiETHRs(deployer, network), deployiUSDRs(deployer, network),
    ]);

};


module.exports = migration;


// ============ Deploy Functions ============


// when deploy rebasers and itoken reserves, it should be unannotated

async function deployiBTCRs(deployer, network) {
    let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
    let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    await deployer.deploy(iBTCReserves, reserveToken, iBTCProxy.address);
    await deployer.deploy(iBTCRebaser,
        iBTCProxy.address,
        reserveToken,
        uniswap_factory,
        iBTCReserves.address,
        '0x0000000000000000000000000000000000000000',
        web3.utils.toBN(10 ** 16) // 1%
    );
    let rebase = new web3.eth.Contract(iBTCRebaser.abi, iBTCRebaser.address);

    let pair = await rebase.methods.uniswap_pair().call();
    console.log(pair);
    let ibtc = await iBTCProxy.deployed();
    await ibtc._setRebaser(iBTCRebaser.address);
    let reserves = await iBTCReserves.deployed();
    await reserves._setRebaser(iBTCRebaser.address)
}

async function deployiETHRs(deployer, network) {
    let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
    let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    await deployer.deploy(iETHReserves, reserveToken, iETHProxy.address);
    await deployer.deploy(iETHRebaser,
        iETHProxy.address,
        reserveToken,
        uniswap_factory,
        iETHReserves.address,
        '0x0000000000000000000000000000000000000000',
        web3.utils.toBN(10 ** 16) // 1%
    );
    let rebase = new web3.eth.Contract(iETHRebaser.abi, iETHRebaser.address);

    let pair = await rebase.methods.uniswap_pair().call();
    console.log(pair);
    let ieth = await iETHProxy.deployed();
    await ieth._setRebaser(iETHRebaser.address);
    let reserves = await iETHReserves.deployed();
    await reserves._setRebaser(iETHRebaser.address)
}

async function deployiUSDRs(deployer, network) {
    let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
    let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    await deployer.deploy(iUSDReserves, reserveToken, iUSDProxy.address);
    await deployer.deploy(iUSDRebaser,
        iUSDProxy.address,
        reserveToken,
        uniswap_factory,
        iUSDReserves.address,
        '0x0000000000000000000000000000000000000000',
        web3.utils.toBN(10 ** 16) // 1%
    );
    let rebase = new web3.eth.Contract(iUSDRebaser.abi, iUSDRebaser.address);

    let pair = await rebase.methods.uniswap_pair().call();
    console.log(pair);
    let iusd = await iUSDProxy.deployed();
    await iusd._setRebaser(iUSDRebaser.address);
    let reserves = await iUSDReserves.deployed();
    await reserves._setRebaser(iUSDRebaser.address)
}