import {
  iToken
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const iusd = new iToken(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("post-deployment", () => {
  let snapshotId;
  let user;

  beforeAll(async () => {
    const accounts = await iusd.web3.eth.getAccounts();
    iusd.addAccount(accounts[0]);
    user = accounts[0];
    snapshotId = await iusd.testing.snapshot();
  });

  beforeEach(async () => {
    await iusd.testing.resetEVM("0x2");
  });

  describe("supply ownership", () => {

    test("owner balance", async () => {
      let balance = await iusd.contracts.iusd.methods.balanceOf(user).call();
      expect(balance).toBe(iusd.toBigN(7000000).times(iusd.toBigN(10**18)).toString())
    });

    test("pool balances", async () => {
      let iusd_balance = await iusd.contracts.iusd.methods.balanceOf(iusd.contracts.blenheimPalace.options.address).call();

      expect(iusd_balance).toBe(iusd.toBigN(1500000).times(iusd.toBigN(10**18)).times(iusd.toBigN(1)).toString())
    });

    test("total supply", async () => {
      let ts = await iusd.contracts.iusd.methods.totalSupply().call();
      expect(ts).toBe("10500000000000000000000000")
    });

    test("init supply", async () => {
      let init_s = await iusd.contracts.iusd.methods.initSupply().call();
      expect(init_s).toBe("10500000000000000000000000000000")
    });
  });

  describe("contract ownership", () => {

    test("iusd gov", async () => {
      let gov = await iusd.contracts.iusd.methods.gov().call();
      expect(gov).toBe(iusd.contracts.timelock.options.address)
    });

    test("rebaser gov", async () => {
      let gov = await iusd.contracts.rebaser.methods.gov().call();
      expect(gov).toBe(iusd.contracts.timelock.options.address)
    });

    test("reserves gov", async () => {
      let gov = await iusd.contracts.reserves.methods.gov().call();
      expect(gov).toBe(iusd.contracts.timelock.options.address)
    });

    test("timelock admin", async () => {
      let gov = await iusd.contracts.timelock.methods.admin().call();
      expect(gov).toBe(iusd.contracts.gov.options.address)
    });

    test("gov timelock", async () => {
      let tl = await iusd.contracts.gov.methods.timelock().call();
      expect(tl).toBe(iusd.contracts.timelock.options.address)
    });

    test("gov guardian", async () => {
      let grd = await iusd.contracts.gov.methods.guardian().call();
      expect(grd).toBe("0x0000000000000000000000000000000000000000")
    });

    test("pool owner", async () => {
      let owner = await iusd.contracts.blenheimPalace.methods.owner().call();
      expect(owner).toBe(iusd.contracts.timelock.options.address)
    });

    test("incentives owner", async () => {
      let owner = await iusd.contracts.blenheimPalace.methods.owner().call();
      expect(owner).toBe(iusd.contracts.timelock.options.address)
    });

    test("pool rewarder", async () => {
      let rewarder = await iusd.contracts.blenheimPalace.methods.rewardDistribution().call();
      expect(rewarder).toBe(iusd.contracts.timelock.options.address)
    });
  });

  describe("timelock delay initiated", () => {
    test("timelock delay initiated", async () => {
      let inited = await iusd.contracts.timelock.methods.admin_initialized().call();
      expect(inited).toBe(true);
    })
  })
})
