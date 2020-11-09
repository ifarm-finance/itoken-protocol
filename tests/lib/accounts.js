import * as Types from './types.js';

export class Account {
  constructor(
    contracts,
    address
  ) {
    this.contracts = contracts;
    this.accountInfo = address;
    this.type = "";
    this.allocation = [];
    this.balances = {};
    this.status = "";
    this.approvals = {};
    this.walletInfo = {};
  }

  async getsCRVWalletBalance() {
    this.walletInfo["sCRV"] = await this.contracts.scrv.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["sCRV"]
  }

  async getWETHWalletBalance() {
    this.walletInfo["WETH"] = await this.contracts.weth.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["WETH"]
  }

  async getETHWalletBalance() {
    this.walletInfo["ETH"] = await this.contracts.web3.eth.getBalance(this.accountInfo);
    return this.walletInfo["ETH"]
  }
}
