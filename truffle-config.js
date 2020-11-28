require('dotenv-flow').config();
const result = require('dotenv').config(); // read .env file saved in project root
if (result.error) {
    throw result.error;
}

const HDWalletProvider = require("@truffle/hdwallet-provider");
var Web3 = require('web3');

module.exports = {
    // migrations_directory: "./migrations/ignore_migrations",
    migrations_directory: "./migrations/",
    compilers: {
        solc: {
            version: '0.5.17',
            docker: false,
            // docker: process.env.DOCKER_COMPILER !== undefined
            // ? process.env.DOCKER_COMPILER === 'true' : true,
            parser: 'solcjs',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 50000
                },
                evmVersion: 'istanbul',
            },
        },
    },

    networks: {
        ropsten: {
            network_id: '3',
            provider: () => new HDWalletProvider(
                [process.env.DEPLOYER_PRIVATE_KEY],
                'https://ropsten.infura.io/v3' + process.env.INFURA_ID,
                0, 1),
            gasPrice: 30000000000, // 10 gwei
            gas: 6900001,
            from: process.env.DEPLOYER_ACCOUNT,
            timeoutBlocks: 500,
        },
        development: {
            host: '127.0.0.1',
            port: 8545,
            // gasPrice: 100000000000, // 100 gwei
            gas: 6721975,
            network_id: '*',
        },
        demo: {
            host: '8.129.187.233',
            port: 28545,
            // gasPrice: 100000000000, // 100 gwei
            gas: 6721975,
            network_id: '*',
        },
        /*
        mainnet: {
            network_id: '1',
            provider: () => new HDWalletProvider(
                [process.env.DEPLOYER_PRIVATE_KEY],
                "https://mainnet.infura.io/v3/731a2b3d28e445b7ac56f23507614fea",
                0,
                1,
            ),
            gasPrice: Number(process.env.GAS_PRICE),
            gas: 8000000,
            from: process.env.DEPLOYER_ACCOUNT,
            timeoutBlocks: 8000000,
        },
        */
    },
};
