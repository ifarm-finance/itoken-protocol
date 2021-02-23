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

// ============ Main Migration ============

const migration = async (deployer, network) => {
    await Promise.all([
        deployToken(deployer, network),
    ]);
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
            "90000000000000000000000000", // print extra few mil for user
            iBTCImplementation.address,
            "0x"
        );
    } else {
        await deployer.deploy(iBTCProxy,
            "RiceQuant BTC",
            "rBTC",
            18,
            "90000000000000000000000000",
            iBTCImplementation.address,
            "0x"
        );
    }

    await deployer.deploy(iETHImplementation);
    if (network != "mainnet") {
        await deployer.deploy(iETHProxy,
            "RiceQuant ETH",
            "rETH",
            18,
            "90000000000000000000000000", // print extra few mil for user
            iBTCImplementation.address,
            "0x"
        );
    } else {
        await deployer.deploy(iETHProxy,
            "RiceQuant ETH",
            "rETH",
            18,
            "90000000000000000000000000",
            iETHImplementation.address,
            "0x"
        );
    }

    await deployer.deploy(iUSDImplementation);
    if (network != "mainnet") {
        await deployer.deploy(iUSDProxy,
            "RiceQuant USD",
            "rUSD",
            18,
            "90000000000000000000000000", // print extra few mil for user
            iBTCImplementation.address,
            "0x"
        );
    } else {
        await deployer.deploy(iUSDProxy,
            "RiceQuant iUSD",
            "rUSD",
            18,
            "90000000000000000000000000",
            iUSDImplementation.address,
            "0x"
        );
    }

}