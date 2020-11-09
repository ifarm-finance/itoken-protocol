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
    defaultGasPrice: "1",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("Distribution", () => {
  let snapshotId;
  let user;
  let user2;
  let blenheimPalace_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";

  beforeAll(async () => {
    const accounts = await iusd.web3.eth.getAccounts();
    iusd.addAccount(accounts[0]);
    user = accounts[0];
    iusd.addAccount(accounts[1]);
    user2 = accounts[1];
    snapshotId = await iusd.testing.snapshot();
  });

  beforeEach(async () => {
    await iusd.testing.resetEVM("0x2");
  });

  describe("pool failures", () => {
    test("cant join pool 1s early", async () => {
      await iusd.testing.resetEVM("0x2");
      let a = await iusd.web3.eth.getBlock('latest');

      let starttime = await iusd.contracts.eth_pool.methods.starttime().call();

      expect(iusd.toBigN(a["timestamp"]).toNumber()).toBeLessThan(iusd.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);
      await iusd.contracts.weth.methods.approve(iusd.contracts.blenheimPalace.options.address, -1).send({from: user});

      await iusd.testing.expectThrow(
        iusd.contracts.eth_pool.methods.stake(
          iusd.toBigN(200).times(iusd.toBigN(10**18)).toString()
        ).send({
          from: user,
          gas: 300000
        })
      , "not start");


      a = await iusd.web3.eth.getBlock('latest');

      starttime = await iusd.contracts.blenheimPalace.methods.starttime().call();

      expect(iusd.toBigN(a["timestamp"]).toNumber()).toBeLessThan(iusd.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);

      await iusd.contracts.UNIAmpl.methods.approve(iusd.contracts.blenheimPalace.options.address, -1).send({from: user});

      await iusd.testing.expectThrow(iusd.contracts.blenheimPalace.methods.stake(
        "5016536322915819"
      ).send({
        from: user,
        gas: 300000
      }), "not start");
    });

    test("cant join pool blenheimPalace early", async () => {

    });

    test("cant withdraw more than deposited", async () => {
      await iusd.testing.resetEVM("0x2");
      let a = await iusd.web3.eth.getBlock('latest');

      await iusd.contracts.iusd.methods.transfer(user, iusd.toBigN(2000).times(iusd.toBigN(10**18)).toString()).send({
        from: blenheimPalace_account
      });
      await iusd.contracts.blenheimPalace.methods.transfer(user, "5000000000000000").send({
        from: blenheimPalace_account
      });

      let starttime = await iusd.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await iusd.testing.increaseTime(waittime);
      }

      await iusd.contracts.iusd.methods.approve(iusd.contracts.blenheimPalace.options.address, -1).send({from: user});

      await iusd.contracts.blenheimPalace.methods.stake(
        iusd.toBigN(200).times(iusd.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      });

      await iusd.contracts.blenheimPalace.methods.approve(iusd.contracts.blenheimPalace.options.address, -1).send({from: user});

      await iusd.contracts.blenheimPalace.methods.stake(
        "5000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      await iusd.testing.expectThrow(iusd.contracts.blenheimPalace.methods.withdraw(
        "5016536322915820"
      ).send({
        from: user,
        gas: 300000
      }), "");

      await iusd.testing.expectThrow(iusd.contracts.blenheimPalace.methods.withdraw(
        iusd.toBigN(201).times(iusd.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      }), "");

    });
  });

  describe("blenheimPalace pool", () => {
    test("joining and exiting", async() => {
      await iusd.testing.resetEVM("0x2");

      await iusd.contracts.scrv.methods.transfer(user, "12000000000000000000000000").send({
        from: blenheimPalace_account
      });

      await iusd.contracts.iusd.methods.transfer(user, iusd.toBigN(2000).times(iusd.toBigN(10**18)).toString()).send({
        from: weth_account
      });

      let a = await iusd.web3.eth.getBlock('latest');

      let starttime = await iusd.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await iusd.testing.increaseTime(waittime);
      } else {
        console.log("late entry", waittime)
      }

      await iusd.contracts.weth.methods.approve(iusd.contracts.eth_pool.options.address, -1).send({from: user});

      await iusd.contracts.eth_pool.methods.stake(
        "2000000000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      let earned = await iusd.contracts.eth_pool.methods.earned(user).call();

      let rr = await iusd.contracts.eth_pool.methods.rewardRate().call();

      let rpt = await iusd.contracts.eth_pool.methods.rewardPerToken().call();
      //console.log(earned, rr, rpt);
      await iusd.testing.increaseTime(86400);
      // await iusd.testing.mineBlock();

      earned = await iusd.contracts.eth_pool.methods.earned(user).call();

      rpt = await iusd.contracts.eth_pool.methods.rewardPerToken().call();

      let ysf = await iusd.contracts.iusd.methods.iusdsScalingFactor().call();

      console.log(earned, ysf, rpt);

      let j = await iusd.contracts.eth_pool.methods.getReward().send({
        from: user,
        gas: 300000
      });

      let iusd_bal = await iusd.contracts.iusd.methods.balanceOf(user).call()

      console.log("iusd bal", iusd_bal)
      // start rebasing
        //console.log("approve iusd")
        await iusd.contracts.iusd.methods.approve(
          iusd.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });
        //console.log("approve scrv")
        await iusd.contracts.scrv.methods.approve(
          iusd.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });

        let scrv_bal = await iusd.contracts.scrv.methods.balanceOf(user).call()

        console.log("scrv_bal bal", scrv_bal)

        console.log("add liq/ create pool")
        await iusd.contracts.uni_router.methods.addLiquidity(
          iusd.contracts.iusd.options.address,
          iusd.contracts.scrv.options.address,
          iusd_bal,
          iusd_bal,
          iusd_bal,
          iusd_bal,
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

        await iusd.contracts.uni_pair.methods.approve(
          iusd.contracts.blenheimPalace.options.address,
          -1
        ).send({
          from: user,
          gas: 300000
        });

        starttime = await iusd.contracts.blenheimPalace.methods.starttime().call();

        a = await iusd.web3.eth.getBlock('latest');

        waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await iusd.testing.increaseTime(waittime);
        } else {
          console.log("late entry, pool 2", waittime)
        }

        await iusd.contracts.blenheimPalace.methods.stake(bal).send({from: user, gas: 400000});


        earned = await iusd.contracts.blenheimPalace.methods.earned(user).call();

        rr = await iusd.contracts.blenheimPalace.methods.rewardRate().call();

        rpt = await iusd.contracts.blenheimPalace.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await iusd.testing.increaseTime(625000 + 1000);

        earned = await iusd.contracts.blenheimPalace.methods.earned(user).call();

        rr = await iusd.contracts.blenheimPalace.methods.rewardRate().call();

        rpt = await iusd.contracts.blenheimPalace.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await iusd.contracts.blenheimPalace.methods.exit().send({from: user, gas: 400000});

        iusd_bal = await iusd.contracts.iusd.methods.balanceOf(user).call();


        expect(iusd.toBigN(iusd_bal).toNumber()).toBeGreaterThan(0)
        console.log("iusd bal after staking in pool 2", iusd_bal);
    });
  })
