const { time, constants } = require('@openzeppelin/test-helpers');
const contractModels = require("./config/contractModel")

// ============ Contracts ============
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");
const iTokenDelegator = artifacts.require("iTokenDelegator");

const tokens = {
    "rUSD": "rUSD",
    "rBTC": "rBTC",
    "rETH": "rETH",
    "USDT": "HUSD",
    "BTC": "HBTC",
    "ETH": "HETH"
}

// 4 hour: 60*60*4 = 14400 sec
// 1 hour: 60*60 = 3600 sec
const RebaseTimingParameters = {
    "bnbmainnet": {
        "minRebaseTimeIntervalSec": "14400",
        "rebaseWindowOffsetSec": "0",
        "rebaseWindowLengthSec": "3600"
    },
    "rinkeby": {
        "minRebaseTimeIntervalSec": "120",
        "rebaseWindowOffsetSec": "0",
        "rebaseWindowLengthSec": "60"
    }
}

/**
 * Warn: 
 * 1) Modify the hex value of the pairFor method of the rebase contract, 
 *  and its content is consistent with the hex value in the swapRouter contract on the chain
 *  .. rinkeby: 96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f
 *  .. bnbmainnet: d0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66
 */


// ============ Main Migration ============
const migration = async (deployer, network) => {
    if (network.indexOf('fork') != -1) {
        return
    }
    this.contractsAddr = contractModels.formatAddress(network)
    this.swapFactoryAddr = this.contractsAddr['factory']
    await Promise.all([
        // await deployRebaser(tokens.USDT, tokens.rUSD, network),
        await deployRebaser(tokens.BTC, tokens.rBTC, network),
        await deployRebaser(tokens.ETH, tokens.rETH, network)
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============
async function deployRebaser(token, rtoken, network) {
    let tokenAddr = this.contractsAddr[token]
    let itokenAddr = this.contractsAddr[rtoken]
    let itokenInstance = await iTokenDelegator.at(itokenAddr)
    let reserverInstance = await Reserves.new(tokenAddr, itokenAddr);
    let rebaserInstance = await Rebaser.new(
        itokenAddr,
        tokenAddr,
        this.swapFactoryAddr,
        reserverInstance.address,
        constants.ZERO_ADDRESS,
        0
    )
    // Sets the parameters which control the timing and frequency of rebase operations.
    if (network.indexOf('rinkeby') != -1) {
        // testing settings
        console.log(`test params settings...`)
        await rebaserInstance.setRebaseTimingParameters(
            RebaseTimingParameters[network].minRebaseTimeIntervalSec,
            RebaseTimingParameters[network].rebaseWindowOffsetSec,
            RebaseTimingParameters[network].rebaseWindowLengthSec
        )
    }
    await reserverInstance._setRebaser(rebaserInstance.address);
    await itokenInstance._setRebaser(rebaserInstance.address);
    await rebaserInstance.init_twap();
    console.log(`${rtoken}Rebaser: ${rebaserInstance.address}`)
}