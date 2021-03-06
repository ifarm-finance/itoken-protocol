// ============ Contracts ============
// Content:
// 1. IFA Token
// Token
// deployed first

const MockERC20 = artifacts.require("MockERC20");

const USDC = USDT = sUSD = DAI = bUSD = PAX = mUSD = TUSD = sCRV = yCRV = wBTC = USD = wETH = MockERC20;
// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    if (network.indexOf('fork') != -1) {
        return
    }
    await Promise.all([
        deployToken(deployer, network),
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
       await deployer.deploy(USDC, "BTC", "BTC", 18, "800000000000000000000000000");
       await deployer.deploy(USDT, "USDT", "USDT", 18, "800000000000000000000000000");
       await deployer.deploy(USDT, "ETH", "ETH", 18, "800000000000000000000000000");
    //    await deployer.deploy(sUSD, "sUSD", "sUSD", 18, "500000000000000000000000000");
    // await deployer.deploy(DAI, "HUSD", "HUSD", 18, "800000000000000000000000000");
    // await deployer.deploy(wBTC, "HBTC", "HBTC", 18, "800000000000000000000000000");
    // await deployer.deploy(wETH, "HETH", "HETH", 18, "800000000000000000000000000")
    //    await deployer.deploy(bUSD, "bUSD", "bUSD", 18, "800000000000000000000000000");
    //    await deployer.deploy(PAX, "PAX", "PAX", 18, "400000000000000000000000000");
    //    await deployer.deploy(mUSD, "mUSD", "mUSD", 18, "200000000000000000000000000");
    //    await deployer.deploy(TUSD, "TUSD", "TUSD", 18, "700000000000000000000000000");
    //    await deployer.deploy(sCRV, "sCRV", "sCRV", 18, "900000000000000000000000000");
    //    await deployer.deploy(yCRV, "yCRV", "yCRV", 18, "300000000000000000000000000");
}