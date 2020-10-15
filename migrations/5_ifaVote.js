// ============ Contracts ============
// Content
// 1. IFAVote

const IFAVote = artifacts.require("IFAVote");


// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([
        deployIFAVote(deployer, network),
    ]);
};

module.exports = migration;

// ============ Deploy Functions ============
// This is split across multiple files so that
// if the web3 provider craps out, all progress isn't lost.
//
// This is at the expense of having to do 6 extra txs to sync the migrations
// contract

async function deployIFAVote(deployer, network) {
    await deployer.deploy(IFAVote);
}
