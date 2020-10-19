// ============ Contracts ============


// Protocol
// deployed first
// deployed IFA

// deployed second
const iTokenImplementation = artifacts.require("iTokenDelegate");
const iTokenProxy = artifacts.require("iTokenDelegator");

const iBTCImplementation = iETHImplementation = iUSDImplementation = iTokenImplementation;
const iBTCProxy = iETHProxy = iUSDProxy = iTokenProxy;
// deployed third
const iTokenReserves = artifacts.require("iTokenReserves");
const iTokenRebaser = artifacts.require("iTokenRebaser");

const iBTCReserves = iETHReserves = iUSDReserves = iTokenReserves;
const iBTCRebaser = iETHRebaser = iUSDRebaser = iTokenRebaser;

const Timelock = artifacts.require("Timelock");
const iBTCTimelock = iETHTimelock = iUSDTimelock = Timelock;

const iTokenGov = artifacts.require("iTokenGovernorAlpha");
const iBTCGov = iETHGov = iUSDGov = iTokenGov;

// deployed fourth

const BlenheimPalace = artifacts.require("BlenheimPalace");
const RockefellerManor = artifacts.require("RockefellerManor");
const YasnayaPolyana = artifacts.require("YasnayaPolyana");


// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([
        // deployTestContracts(deployer, network),
        deployDistribution(deployer, network, accounts),
        // deploySecondLayer(deployer, network)
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
    console.log(network);

    let iusd = await iUSDProxy.deployed();
    let iusdReserves = await iUSDReserves.deployed();
    let iusdRebaser = await iUSDRebaser.deployed();


    let ieth = await iETHProxy.deployed();
    let iethReserves = await iETHReserves.deployed();
    let iethRebaser = await iETHRebaser.deployed();

    let ibtc = await iBTCProxy.deployed();
    let ibtcReserves = await iBTCReserves.deployed();
    let ibtcRebaser = await iBTCRebaser.deployed();

    let iusdTimelock = await iUSDTimelock.deployed();
    let iethTimelock = await iETHTimelock.deployed();
    let ibtcTimelock = await iBTCTimelock.deployed();


    let iusdGov = await iUSDGov.deployed();
    let iethGov = await iETHGov.deployed();
    let ibtcGov = await iBTCGov.deployed();


    await deployer.deploy(BlenheimPalace);
    await deployer.deploy(RockefellerManor);
    await deployer.deploy(YasnayaPolyana);

    let blenheimPalace = new web3.eth.Contract(BlenheimPalace.abi, BlenheimPalace.address);
    let rockefellerManor = new web3.eth.Contract(RockefellerManor.abi, RockefellerManor.address);
    let yasnayaPolyana = new web3.eth.Contract(YasnayaPolyana.abi, YasnayaPolyana.address);


    // set rewardVote(IFAVote address)
    console.log("setting rewardVote");
    await Promise.all([
        blenheimPalace.methods.setRewardVote(IFAVote.address),
        rockefellerManor.methods.setRewardVote(IFAVote.address),
        yasnayaPolyana.methods.setRewardVote(IFAVote.address),
    ]);

    console.log("setting distributor");
    await Promise.all([
        blenheimPalace.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        rockefellerManor.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        yasnayaPolyana.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
    ]);


    console.log("transfering and notifying");
    await Promise.all([
        iusd._setIncentivizer(BlenheimPalace.address),

        ibtc._setIncentivizer(YasnayaPolyana.address),

        ieth._setIncentivizer(RockefellerManor.address),


    ]);
    await Promise.all([
        // pools is a minter and prepopulates itself.
        blenheimPalace.methods.notifyRewardAmount("0"),
        rockefellerManor.methods.notifyRewardAmount("0"),
        yasnayaPolyana.methods.notifyRewardAmount("0"),
    ]);


    // transfer RewardDistribution Ownership to Timelock
    /*
    await Promise.all([
        blenheimPalace.methods.setRewardDistribution(iUSDTimelock.address).send({from: accounts[0], gas: 100000}),
                yasnayaPolyana.methods.setRewardDistribution(iBTCTimelock.address).send({from: accounts[0], gas: 100000}),
        rockefellerManor.methods.setRewardDistribution(iETHimelock.address).send({from: accounts[0], gas: 100000}),
    ]);


    // transfer Pool Ownership to Timelock
    await Promise.all([
        blenheimPalace.methods.transferOwnership(iUSDTimelock.address).send({from: accounts[0], gas: 100000}),
        yasnayaPolyana.methods.transferOwnership(iBTCTimelock.address).send({from: accounts[0], gas: 100000}),
        rockefellerManor.methods.transferOwnership(iETHimelock.address).send({from: accounts[0], gas: 100000}),
    ]);
    */

    /*
    await Promise.all([

        // iTokens Gov setting
        iusd._setPendingGov(iUSDTimelock.address),
        iusdReserves._setPendingGov(iUSDTimelock.address),
        iusdRebaser._setPendingGov(iUSDTimelock.address),

        ibtc._setPendingGov(iBTCTimelock.address),
        ibtcReserves._setPendingGov(iBTCTimelock.address),
        ibtcRebaser._setPendingGov(iBTCTimelock.address),

        ieth._setPendingGov(iETHTimelock.address),
        iethReserves._setPendingGov(iETHTimelock.address),
        iethRebaser._setPendingGov(iETHTimelock.address),


    ]);

    await Promise.all([


        // iUSD
        iusdTimelock.executeTransaction(
            iUSDProxy.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        iusdTimelock.executeTransaction(
            iUSDReserves.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        iusdTimelock.executeTransaction(
            iUSDRebaser.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        // iBTC
        ibtcTimelock.executeTransaction(
            iBTCProxy.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        ibtcTimelock.executeTransaction(
            iBTCReserves.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        ibtcTimelock.executeTransaction(
            iBTCRebaser.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),


        // iETH
        iethTimelock.executeTransaction(
            iETHProxy.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        iethTimelock.executeTransaction(
            iETHReserves.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),

        iethTimelock.executeTransaction(
            iETHRebaser.address,
            0,
            "_acceptGov()",
            "0x",
            0
        ),
    ]);

    await iusdTimelock.setPendingAdmin(iUSDGov.address);
    await iusdGov.__acceptAdmin();
    await iusdGov.__abdicate();

    await ibtcTimelock.setPendingAdmin(iBTCGov.address);
    await ibtcGov.__acceptAdmin();
    await ibtcGov.__abdicate();

    await iethTimelock.setPendingAdmin(iETHGov.address);
    await iethGov.__acceptAdmin();
    await iethGov.__abdicate();


    */
}
