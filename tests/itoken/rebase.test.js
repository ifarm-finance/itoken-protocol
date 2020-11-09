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

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await iusd.web3.eth.getAccounts();
    iusd.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await iusd.testing.snapshot();
  });

  beforeEach(async () => {
    await iusd.testing.resetEVM("0x2");
    let a = await iusd.contracts.scrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has scrv", async () => {
      let bal0 = await iusd.contracts.scrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await iusd.contracts.uni_fact.methods.createPair(
        iusd.contracts.scrv.options.address,
        iusd.contracts.iusd.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();
      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();
      expect(iusd.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();
      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(1000);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await iusd.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(iusd.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(iusd.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();
      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(1000);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await iusd.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(iusd.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(iusd.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await iusd.testing.increaseTime(12 * 60 * 60);

      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();

      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(43200);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await iusd.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await iusd.contracts.iusd.methods.balanceOf(
          iusd.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let a = await iusd.web3.eth.getBlock('latest');

      let offset = await iusd.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = iusd.toBigN(offset).toNumber();
      let interval = await iusd.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = iusd.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await iusd.testing.increaseTime(i);

      let r = await iusd.contracts.uni_pair.methods.getReserves().call();
      let q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await iusd.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let resiUSD = await iusd.contracts.iusd.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      let resscrv = await iusd.contracts.scrv.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      console.log("bal user, bal iusd res, bal res crv", bal1, resiUSD, resscrv);
      r = await iusd.contracts.uni_pair.methods.getReserves().call();
      q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(iusd.toBigN(bal).toNumber()).toBeLessThan(iusd.toBigN(bal1).toNumber());
      // used full iusd reserves
      expect(iusd.toBigN(resiUSD).toNumber()).toBe(0);
      // increases reserves
      expect(iusd.toBigN(resscrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(iusd.toBigN(q).toNumber()).toBeGreaterThan(iusd.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();

      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(43200);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await iusd.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let a = await iusd.web3.eth.getBlock('latest');

      let offset = await iusd.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = iusd.toBigN(offset).toNumber();
      let interval = await iusd.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = iusd.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await iusd.testing.increaseTime(i);

      let r = await iusd.contracts.uni_pair.methods.getReserves().call();
      let q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await iusd.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let resiUSD = await iusd.contracts.iusd.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      let resscrv = await iusd.contracts.scrv.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      // balance decreases
      expect(iusd.toBigN(bal1).toNumber()).toBeLessThan(iusd.toBigN(bal).toNumber());
      // no increases to reserves
      expect(iusd.toBigN(resiUSD).toNumber()).toBe(0);
      expect(iusd.toBigN(resscrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();

      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(43200);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await iusd.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let a = await iusd.web3.eth.getBlock('latest');

      let offset = await iusd.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = iusd.toBigN(offset).toNumber();
      let interval = await iusd.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = iusd.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await iusd.testing.increaseTime(i);

      let r = await iusd.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await iusd.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let resiUSD = await iusd.contracts.iusd.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      let resscrv = await iusd.contracts.scrv.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      // no change
      expect(iusd.toBigN(bal1).toNumber()).toBe(iusd.toBigN(bal).toNumber());
      // no increases to reserves
      expect(iusd.toBigN(resiUSD).toNumber()).toBe(0);
      expect(iusd.toBigN(resscrv).toNumber()).toBe(0);
      r = await iusd.contracts.uni_pair.methods.getReserves().call();
      q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with iUSD in reserves", async () => {
      await iusd.contracts.iusd.methods.transfer(iusd.contracts.reserves.options.address, iusd.toBigN(60000*10**18).toString()).send({from: user});
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();

      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(43200);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await iusd.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let a = await iusd.web3.eth.getBlock('latest');

      let offset = await iusd.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = iusd.toBigN(offset).toNumber();
      let interval = await iusd.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = iusd.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await iusd.testing.increaseTime(i);


      let r = await iusd.contracts.uni_pair.methods.getReserves().call();
      let q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await iusd.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let resiUSD = await iusd.contracts.iusd.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      let resscrv = await iusd.contracts.scrv.methods.balanceOf(iusd.contracts.reserves.options.address).call();

      console.log(bal, bal1, resiUSD, resscrv);
      expect(iusd.toBigN(bal).toNumber()).toBeLessThan(iusd.toBigN(bal1).toNumber());
      expect(iusd.toBigN(resiUSD).toNumber()).toBeGreaterThan(0);
      expect(iusd.toBigN(resscrv).toNumber()).toBeGreaterThan(0);
      r = await iusd.contracts.uni_pair.methods.getReserves().call();
      q = await iusd.contracts.uni_router.methods.quote(iusd.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(iusd.toBigN(q).toNumber()).toBeGreaterThan(iusd.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await iusd.testing.expectThrow(iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await iusd.testing.expectThrow(iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();

      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(43200);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await iusd.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let a = await iusd.web3.eth.getBlock('latest');

      let offset = await iusd.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = iusd.toBigN(offset).toNumber();
      let interval = await iusd.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = iusd.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await iusd.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await iusd.testing.increaseTime(i + iusd.toBigN(len).toNumber()+1);

      let b = await iusd.testing.expectThrow(iusd.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await iusd.contracts.iusd.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await iusd.contracts.scrv.methods.approve(
        iusd.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await iusd.contracts.uni_router.methods.addLiquidity(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await iusd.contracts.uni_fact.methods.getPair(
        iusd.contracts.iusd.options.address,
        iusd.contracts.scrv.options.address
      ).call();

      iusd.contracts.uni_pair.options.address = pair;
      let bal = await iusd.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await iusd.testing.increaseTime(43200);

      await iusd.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await iusd.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await iusd.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await iusd.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          iusd.contracts.scrv.options.address,
          iusd.contracts.iusd.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await iusd.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await iusd.contracts.iusd.methods.balanceOf(user).call();

      let a = await iusd.web3.eth.getBlock('latest');

      let offset = await iusd.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = iusd.toBigN(offset).toNumber();
      let interval = await iusd.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = iusd.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await iusd.testing.increaseTime(i - 1);



      let b = await iusd.testing.expectThrow(iusd.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
