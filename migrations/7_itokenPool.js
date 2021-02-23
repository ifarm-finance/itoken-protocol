const blenheimPalace = artifacts.require("BlenheimPalace");
const rockefellerManor = artifacts.require("RockefellerManor");
const yasnayaPolyana = artifacts.require("YasnayaPolyana");
const itoken = artifacts.require("iTokenDelegator");
const mockERC20 = artifacts.require("MockERC20");
const { getDeployedContract } = require("./config/contract_address")

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

const lpTokens = {
    'IFA_DAI': DeployedContract.lpTokenAddress.IFA_DAI,
    'IFA_wBTC': DeployedContract.lpTokenAddress.IFA_wBTC,
    'IFA_ETH': DeployedContract.lpTokenAddress.IFA_ETH
}

let contractAddress = {}

const migration = async (deployer, network, accounts) => {
    if (network != "ropsten") {
        return
    }
    await Promise.all([
        await deployBlenheimPalace(deployer, network, accounts[0]),
        await deployRockefellerManor(deployer, network, accounts[0]),
        await deployYasnayaPolyana(deployer, network, accounts[0])
    ]);
    console.log(`contract: ${JSON.stringify(contractAddress)}`)
};

module.exports = migration;

async function deployBlenheimPalace(deployer, network, account) {
    console.log(`account:${account}`);
    let rewardTotalSupply = web3.utils.toWei('10000');
    let approveAmount = web3.utils.toWei('10000000000000000000000000');
    let bpPool = await blenheimPalace.new();
    let iUSD = new web3.eth.Contract(itoken.abi, tokens.iUSD);
    let lpToken = new web3.eth.Contract(mockERC20.abi, lpTokens.IFA_DAI)
    await iUSD.methods._setIncentivizer(bpPool.address).send({ from: account, gas: '6000000' });
    await bpPool.setRewardDistribution(account);
    await bpPool.notifyRewardAmount(rewardTotalSupply);
    await lpToken.methods.approve(bpPool.address, approveAmount).send({from: account, gas: '6000000'});
    contractAddress["BlenheimPalace"] = bpPool.address;
}

async function deployRockefellerManor(deployer, network, account) {
    console.log(`account:${account}`);
    let rewardTotalSupply = web3.utils.toWei('10000');
    let approveAmount = web3.utils.toWei('10000000000000000000000000');
    let rmPool = await rockefellerManor.new();
    let iETH = new web3.eth.Contract(itoken.abi, tokens.iETH);
    let lpToken = new web3.eth.Contract(mockERC20.abi, lpTokens.IFA_ETH)
    await iETH.methods._setIncentivizer(rmPool.address).send({ from: account, gas: '6000000' });
    await rmPool.setRewardDistribution(account);
    await rmPool.notifyRewardAmount(rewardTotalSupply);
    await lpToken.methods.approve(rmPool.address, approveAmount).send({from: account, gas: '6000000'});
    contractAddress["RockefellerManor"] = rmPool.address;
}

async function deployYasnayaPolyana(deployer, network, account) {
    console.log(`account:${account}`);
    let rewardTotalSupply = web3.utils.toWei('10000');
    let approveAmount = web3.utils.toWei('10000000000000000000000000');
    let ypPool = await yasnayaPolyana.new();
    let iBTC = new web3.eth.Contract(itoken.abi, tokens.iBTC);
    let lpToken = new web3.eth.Contract(mockERC20.abi, lpTokens.IFA_wBTC)
    await iBTC.methods._setIncentivizer(ypPool.address).send({ from: account, gas: '6000000' });
    await ypPool.setRewardDistribution(account);
    await ypPool.notifyRewardAmount(rewardTotalSupply);
    await lpToken.methods.approve(ypPool.address, approveAmount).send({from: account, gas: '6000000'});
    contractAddress["YasnayaPolyana"] = ypPool.address;
}