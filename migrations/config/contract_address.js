
// Contract address
current_net = 'ropsten'

// develop address
const allDevelopContract = {
    'uniswapsAddress': {
        'uniswapV2Factory': "0xBBa9c67e95e3D997a8Af1D1AB0A0b5076A60BAB2",
        'uniswapV2Router': "0xDbA9FC3A3f07a2b9d085C78CE488b9D145430ECc",
    },
    'itokensAddress': {
        'iETH': "0xc257BCf9EEEbC727C14BA4451298ec70534540eC",
        'iBTC': "0x3362599C498AaE2087ace38CEff19FcE08FfD0ae",
        'iUSD': "0xB178B47afbc33BDd036D178E4F48d3086e3beFF5",
    },
    'tokensAddress': {
        'DAI': '0xe5737F0f694897331FE28640D2164B1404F23Dc0',
        'wBTC': '0xe65b25FE4bec1F5aC9364304a175d68b582f5d0a',
        'wETH': '0x9004529746a3d2496E46248929a3a57Cd30B0d0f',
        'IFA': '0x567E6A969170217862632cFE93b6e36B9565e262',
        'USD': '0x7F4939cFE161A7159B5e156b99B6fbE0694c239c',
    }
}

// ropsten address
const allRopstenContract = {
    'uniswapsAddress': {
        'uniswapV2Factory': "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        'uniswapV2Router': "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    'itokensAddress': {
        'iETH': "0x3B10CE8EE476353E90e432a8B046D7557A175caE",
        'iBTC': "0x72021548D50aE9650474f0e44e1b97A1fDa7ec62",
        'iUSD': "0x396a3BD7dD826870505532122109f8c59253F34f",
    },
    'tokensAddress': {
        'DAI': '0x995382d6B2C6007357948e7bF6e7ed6D162E67Ea',
        'wBTC': '0x8c5677b4FEaff533daB4638D7BEd7FFc972c4E84',
        'wETH': '0xc778417E063141139Fce010982780140Aa0cD5Ab',
        'IFA': '0x58eABbc7438bd1e025868bD75d55aDEe1c1A1995',
        'USD': '0x4d97D3bf4A0bD87F9DEBb16873BdfE24127C9307',
    }
}

// local address
const allLocalContract = {
    'uniswapsAddress': {
        'uniswapV2Factory': "0xBBa9c67e95e3D997a8Af1D1AB0A0b5076A60BAB2",
        'uniswapV2Router': "0xDbA9FC3A3f07a2b9d085C78CE488b9D145430ECc",
    },
    'itokensAddress': {
        'iETH': "0xc257BCf9EEEbC727C14BA4451298ec70534540eC",
        'iBTC': "0x3362599C498AaE2087ace38CEff19FcE08FfD0ae",
        'iUSD': "0xB178B47afbc33BDd036D178E4F48d3086e3beFF5",
    },
    'tokensAddress': {
        'DAI': '0xe5737F0f694897331FE28640D2164B1404F23Dc0',
        'wBTC': '0xe65b25FE4bec1F5aC9364304a175d68b582f5d0a',
        'wETH': '0x9004529746a3d2496E46248929a3a57Cd30B0d0f',
        'IFA': '0x567E6A969170217862632cFE93b6e36B9565e262',
        'USD': '0x7F4939cFE161A7159B5e156b99B6fbE0694c239c',
    }
}

let net_items = {
    'develop': allDevelopContract,
    'ropsten': allRopstenContract,
    'local': allLocalContract,
}

let getDeployedContract = () => {
    return net_items[current_net]
}

module.exports = {
    'getDeployedContract': getDeployedContract
}