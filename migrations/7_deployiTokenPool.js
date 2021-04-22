const contractModels = require("./config/contractModel")
const poolsInfo = require("./config/poolsInfo")
const blenheimPalace = artifacts.require("BlenheimPalace");
const rockefellerManor = artifacts.require("RockefellerManor");
const yasnayaPolyana = artifacts.require("YasnayaPolyana");
const itoken = artifacts.require("iTokenDelegator");

const poolContracts = [
    blenheimPalace,         // rUSD
    yasnayaPolyana,         // rBTC
    rockefellerManor        // rETH
]

/**
 * Warn: 
 * 1）The contract code needs to be modified before deployment, and starttime is modified to the online timestamp
 * 2）Confirm the initreward quantity and modify it to be the same as the quantity required by the operation
 * .. Affected parameters
 *      starttime: uint256  (timestamp)
 *      1618999200; // 2021-04-21 10:00:00 (UTC +00:00)
 * 
 *      initreward: uint256 (wei)
 */

// Whether to enable the pool
const enablePoolsId = [1]

const migration = async (deployer, network, accounts) => {
    if (network.indexOf('fork') != -1) {
        return
    }
    this.contractsAddr = contractModels.formatAddress(network)
    await Promise.all([
        await deployerPools(deployer, network, accounts[0])
    ]);
};

async function deployerPools(deployer, network, account) {
    for (let key in poolsInfo) {
        if (enablePoolsId.indexOf(key * 1) == -1) {
            continue
        }
        let poolId = key
        let poolInfo = poolsInfo[poolId]
        let poolContract = poolContracts[poolId]
        await deployer.deploy(poolContract)
        let poolInstance = await poolContract.deployed()
        let rewardTotalSupply = poolInfo.rewardTotalSupply
        let seedTokenAddr = this.contractsAddr[poolInfo.seedToken]
        let rewardTokenAddr = this.contractsAddr[poolInfo.rewardToken]
        if (network == "rinkeby" || network == "development") {
            console.log(`set test contract addr...`)
            await poolInstance.setiToken(rewardTokenAddr)
            await poolInstance.setLPToken(seedTokenAddr)
            console.log('Set up')
        }
        let iTokenInstance = await itoken.at(rewardTokenAddr)
        await iTokenInstance._setIncentivizer(poolInstance.address)
        process.stdout.write(".")
        await poolInstance.setRewardDistribution(account)
        process.stdout.write(".")
        await poolInstance.notifyRewardAmount(rewardTotalSupply)
        process.stdout.write(".")
        console.log(`\n`)
    }
}


module.exports = migration;