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
<<<<<<< HEAD
            "ricequant-protocol rBTC",
=======
            "RiceQuant BTC",
>>>>>>> 64d579fe518083827f18fabf25f67e3e6f3fa91c
            "rBTC",
            18,
            "90000000000000000000000000", // print extra few mil for user
            iBTCImplementation.address,
            "0x"
        );
    } else {
        await deployer.deploy(iBTCProxy,
<<<<<<< HEAD
            "ricequant-protocol rBTC",
=======
            "RiceQuant BTC",
>>>>>>> 64d579fe518083827f18fabf25f67e3e6f3fa91c
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
<<<<<<< HEAD
            "ricequant-protocol rETH",
=======
            "RiceQuant ETH",
>>>>>>> 64d579fe518083827f18fabf25f67e3e6f3fa91c
            "rETH",
            18,
            "90000000000000000000000000", // print extra few mil for user
            iBTCImplementation.address,
            "0x"
        );
    } else {
        await deployer.deploy(iETHProxy,
<<<<<<< HEAD
            "ricequant-protocol rETH",
=======
            "RiceQuant ETH",
>>>>>>> 64d579fe518083827f18fabf25f67e3e6f3fa91c
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
<<<<<<< HEAD
            "ricequant-protocol rUSD",
=======
            "RiceQuant USD",
>>>>>>> 64d579fe518083827f18fabf25f67e3e6f3fa91c
            "rUSD",
            18,
            "90000000000000000000000000", // print extra few mil for user
            iBTCImplementation.address,
            "0x"
        );
    } else {
        await deployer.deploy(iUSDProxy,
<<<<<<< HEAD
            "ricequant-protocol rUSD",
=======
            "RiceQuant iUSD",
>>>>>>> 64d579fe518083827f18fabf25f67e3e6f3fa91c
            "rUSD",
            18,
            "90000000000000000000000000",
            iUSDImplementation.address,
            "0x"
        );
    }

}