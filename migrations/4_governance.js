// ============ Contracts ============
// Content:
// iUSDGovernorAlpha & iUSDTimelock
// iETHGovernorAlpha & iETHTimelock
// iBTCGovernorAlpha & iBTCTimelock

// Token
// deployed first
const iTokenImplementation = artifacts.require("iTokenDelegate");
const iTokenProxy = artifacts.require("iTokenDelegator");

const iBTCImplementation = iETHImplementation = iUSDImplementation = iTokenImplementation;
const iBTCProxy = iETHProxy = iUSDProxy = iTokenProxy;

// Rs
// deployed second
const iTokenReserves = artifacts.require("iTokenReserves");
const iTokenRebaser = artifacts.require("iTokenRebaser");

const iBTCReserves = iETHReserves = iUSDReserves = iTokenReserves;
const iBTCRebaser = iETHRebaser = iUSDRebaser = iTokenRebaser;

// Governance
// deployed third
const Timelock = artifacts.require("Timelock");
const Gov = artifacts.require("iTokenGovernorAlpha");

const iBTCGov = iETHGov = iUSDGov = Gov;
const iBTCTimelock = iETHTimelock = iUSDTimelock = Timelock;


// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([
        deployGovernance(deployer, network),
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============
// This is split across multiple files so that
// if the web3 provider craps out, all progress isn't lost.
//
// This is at the expense of having to do 6 extra txs to sync the migrations
// contract

async function deployGovernance(deployer, network) {
    let ifaAddress = "0xAd598c73cd9eFd9C7b5970CaDc9FE5B7b09fEcfe";
    await deployer.deploy(iUSDTimelock);
    await deployer.deploy(iETHTimelock);
    await deployer.deploy(iBTCTimelock);

    await deployer.deploy(iUSDGov,
        iUSDTimelock.address,
        iUSDProxy.address,
        ifaAddress
    );

    await deployer.deploy(iETHGov,
        iETHTimelock.address,
        iETHProxy.address,
        ifaAddress
    );

    await deployer.deploy(iBTCGov,
        iBTCTimelock.address,
        iBTCProxy.address,
        ifaAddress
    );
}
