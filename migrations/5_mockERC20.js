// ============ Contracts ============
// Content:
// 1. IFA Token

// Token
// deployed first

const MockERC20 = artifacts.require("MockERC20");

const USDC = USDT = sUSD = DAI = bUSD = PAX = mUSD = TUSD = sCRV = yCRV = wBTC = USD = MockERC20;
// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([
        deployToken(deployer, network),
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
    //    await deployer.deploy(USDC, "USDC", "USDC", 6, "100000000000000000000000");
    //    await deployer.deploy(USDT, "USDT", "USDT", 6, "200000000000000000000000");
    //    await deployer.deploy(sUSD, "sUSD", "sUSD", 18, "500000000000000000000000000");
    // await deployer.deploy(DAI, "DAI", "DAI", 18, "800000000000000000000000000");
    // await deployer.deploy(wBTC, "wBTC", "wBTC", 18, "800000000000000000000000000");
    await deployer.deploy(USD, "USD", "USD", 18, "800000000000000000000000000");
    //    await deployer.deploy(bUSD, "bUSD", "bUSD", 18, "800000000000000000000000000");
    //    await deployer.deploy(PAX, "PAX", "PAX", 18, "400000000000000000000000000");
    //    await deployer.deploy(mUSD, "mUSD", "mUSD", 18, "200000000000000000000000000");
    //    await deployer.deploy(TUSD, "TUSD", "TUSD", 18, "700000000000000000000000000");
    //    await deployer.deploy(sCRV, "sCRV", "sCRV", 18, "900000000000000000000000000");
    //    await deployer.deploy(yCRV, "yCRV", "yCRV", 18, "300000000000000000000000000");

}