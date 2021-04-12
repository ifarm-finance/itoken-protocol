// ============ Contracts ============

// Content:
// 1. iUSD
// 2. iETH
// 3. iUSD

// Token
// deployed first

const iTokenImplementation = artifacts.require("iTokenDelegate");
const iTokenProxy = artifacts.require("iTokenDelegator");

const iBTCImplementation = iETHImplementation = iUSDImplementation = iTokenImplementation;
const iBTCProxy = iETHProxy = iUSDProxy = iTokenProxy;
const contractAddress = {
    "rUSD": "",
    "rBTC": "",
    "rETH": ""
}

// ============ Main Migration ============

const migration = async (deployer, network) => {
    if (network.indexOf('fork') != -1) {
        return
    }
    await Promise.all([
        deployToken(deployer, network),
    ]);
    console.log(JSON.stringify(contractAddress))
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
    await deployer.deploy(iBTCImplementation);
    if (network != "mainnet") {
        await deployer.deploy(iBTCProxy,
            "RiceQuant BTC",
            "rBTC",
            18,
            "100000000000000", // print extra few mil for user (≈$5)
            iBTCImplementation.address,
            "0x"
        );
        contractAddress.rBTC = iBTCProxy.address;
    } else {
        await deployer.deploy(iBTCProxy,
            "RiceQuant BTC",
            "rBTC",
            18,
            "100000000000000",
            iBTCImplementation.address,
            "0x"
        );
        contractAddress.rBTC = iBTCProxy.address;
    }

    await deployer.deploy(iETHImplementation);
    if (network != "mainnet") {
        await deployer.deploy(iETHProxy,
            "RiceQuant ETH",
            "rETH",
            18,
            "3000000000000000", // print extra few mil for user (≈$5)
            iBTCImplementation.address,
            "0x"
        );
        contractAddress.rETH = iETHProxy.address;
    } else {
        await deployer.deploy(iETHProxy,
            "RiceQuant ETH",
            "rETH",
            18,
            "3000000000000000",
            iETHImplementation.address,
            "0x"
        );
        contractAddress.rETH = iETHProxy.address;
    }

    await deployer.deploy(iUSDImplementation);
    if (network != "mainnet") {
        await deployer.deploy(iUSDProxy,
            "RiceQuant USD",
            "rUSD",
            18,
            "5000000000000000000", // print extra few mil for user (≈$5)
            iBTCImplementation.address,
            "0x"
        );
        contractAddress.rUSD = iUSDProxy.address;
    } else {
        await deployer.deploy(iUSDProxy,
            "RiceQuant USD",
            "rUSD",
            18,
            "5000000000000000000",
            iUSDImplementation.address,
            "0x"
        );
        contractAddress.rUSD = iUSDProxy.address;
    }

}