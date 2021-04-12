require('dotenv-flow').config();
const result = require('dotenv').config(); // read .env file saved in project root
if (result.error) {
    throw result.error;
}

const HDWalletProvider = require("@truffle/hdwallet-provider");
// var Web3 = require('web3');

const bnbChainProvider = (network) => {
    let rpcs = {
        'mainnet': 'https://bsc-dataseed.binance.org',
        'testnet': 'https://data-seed-prebsc-1-s1.binance.org:8545'
    }
    let private_key = {
        'mainnet': process.env.DEPLOYER_PRIVATE_KEY || '',
        'testnet': process.env.TEST_DEPLOYER_PRIVATE_KEY || ''
    }
    return new HDWalletProvider(private_key[network], rpcs[network])
};

const infuraProvider = (network) => {
    let rpc = `https://${network}.infura.io/v3/${process.env.INFURA_ID}`
    let private_key = {
      'mainnet': process.env.DEPLOYER_PRIVATE_KEY || '',
      'rinkeby': process.env.TEST_DEPLOYER_PRIVATE_KEY || ''
    }
    return new HDWalletProvider(private_key[network], rpc)
};

module.exports = {
    // migrations_directory: "./migrations/ignore_migrations",
    migrations_directory: "./migrations/",
    plugins: [
        'truffle-plugin-verify'
    ],
    api_keys: {
        bscscan: process.env.BSC_SCAN_API_KEY
    },
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
        hecomainnet: {
            network_id: '128',
            provider: () => new HDWalletProvider(
                [process.env.DEPLOYER_PRIVATE_KEY],
                'https://http-mainnet.hecochain.com', 0, 1),
            // gasPrice: 30000000000, // 10 gwei
            gas: 6721975,
            from: process.env.DEPLOYER_ACCOUNT,
            // timeoutBlocks: 100,
            networkCheckTimeout: 60000,
        },
        hecotestnet: {
            network_id: '256',
            provider: () => new HDWalletProvider(
                [process.env.DEPLOYER_PRIVATE_KEY],
                'https://http-testnet.hecochain.com', 0, 1),
            // gasPrice: 30000000000, // 10 gwei
            gas: 6721975,
            from: process.env.DEPLOYER_ACCOUNT,
            // timeoutBlocks: 100,
            networkCheckTimeout: 60000,
        },
        development: {
            host: '127.0.0.1',
            port: 8545,
            // gasPrice: 100000000000, // 100 gwei
            gas: 6721975,
            network_id: '*',
        },
        remote: {
            host: '8.129.187.233',
            port: 28545,
            // gasPrice: 100000000000, // 100 gwei
            gas: 6721975,
            network_id: '4',
        },
        bnbtestnet: {
            provider: bnbChainProvider('testnet'),
            network_id: "97",  // match any network
            gas: 6721975,
            networkCheckTimeout: 60000,
        },
        bnbmainnet: {
            provider: bnbChainProvider('mainnet'),
            network_id: "56",  // match any network
            gas: 6721975,
            networkCheckTimeout: 60000,
        },
        rinkeby: {
            provider: infuraProvider('rinkeby'),
            network_id: "4",  // match any network
            gas: 6721975,
            networkCheckTimeout: 60000,
        }
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
