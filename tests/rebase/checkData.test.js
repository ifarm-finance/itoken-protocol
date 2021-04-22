const iTokenDelegator = artifacts.require("iTokenDelegator")
const Rebaser = artifacts.require('iTokenRebaser');
const Reserves = artifacts.require("iTokenReserves");
const ERC20 = artifacts.require("MockERC20")

const contractAddr = {
    "rebase": "0xd71f565717Bf6d93E7572a9686018Fa6C317b5B2",
    "USDT": "0x387d9d7901EDcAc1E431e5cDC8E860a9F22960b6",
    "rUSD": "0x3DA9361E5AA1Df3748689a2Dec32A6A8cdb48fb0",
    "rUSD_USDT": "0x197ad94fe35dF4Ee20016EF0b549597e9629D95f"
}

contract('rUSD rebase: check contract data', async ([alice, bob, carol, breeze]) => {
    before(async () => {
        this.rUSDInstance = await iTokenDelegator.at(contractAddr.rUSD)
        this.rUSD_USDTInstance = await ERC20.at(contractAddr.rUSD_USDT)
        this.USDTInstance = await ERC20.at(contractAddr.USDT)
        this.rebaserInstance = await Rebaser.at(contractAddr.rebase)
    })

    it('tokes balanceOf', async () => {
        let rusdBalance = await this.rUSDInstance.balanceOf("0xe2353B4A1B26020b8410bE68e75e9BC3B5d09566")
        let rusdbalanceOfUnderlying = await this.rUSDInstance.balanceOfUnderlying("0xe2353B4A1B26020b8410bE68e75e9BC3B5d09566")
        console.log(`balance: ${rusdBalance.toString()}`)
        console.log(`balanceOfUnderlying: ${rusdbalanceOfUnderlying.toString()}`)
    })
})