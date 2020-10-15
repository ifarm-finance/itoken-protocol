import {iToken} from "../index.js";


export const iusd = new iToken(
    "http://127.0.0.1:9545/",
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

describe("token_tests", () => {
    let snapshotId;
    let user;
    let new_user;
    beforeAll(async () => {
        const accounts = await iusd.web3.eth.getAccounts();
        iusd.addAccount(accounts[0]);
        user = accounts[0];
        new_user = accounts[1];
        snapshotId = await iusd.testing.snapshot();
    });

    beforeEach(async () => {
        await iusd.testing.resetEVM("0x2");
    });

    describe("expected fail transfers", () => {
        test("cant transfer from a 0 balance", async () => {
            await iusd.testing.expectThrow(iusd.contracts.iusd.methods.transfer(user, "100").send({from: new_user}), "SafeMath: subtraction overflow");
        });
        test("cant transferFrom without allowance", async () => {
            await iusd.testing.expectThrow(iusd.contracts.iusd.methods.transferFrom(user, new_user, "100").send({from: new_user}), "SafeMath: subtraction overflow");
        });

    });

    describe("non-failing transfers", () => {
        test("transfer to self doesnt inflate", async () => {
            let bal0 = await iusd.contracts.iusd.methods.balanceOf(user).call();
            await iusd.contracts.iusd.methods.transfer(user, "100").send({from: user});
            let bal1 = await iusd.contracts.iusd.methods.balanceOf(user).call();
            expect(bal0).toBe(bal1);
        });
        test("transferFrom works", async () => {
            let bal00 = await iusd.contracts.iusd.methods.balanceOf(user).call();
            let bal01 = await iusd.contracts.iusd.methods.balanceOf(new_user).call();
            await iusd.contracts.iusd.methods.approve(new_user, "100").send({from: user});
            await iusd.contracts.iusd.methods.transferFrom(user, new_user, "100").send({from: new_user});
            let bal10 = await iusd.contracts.iusd.methods.balanceOf(user).call();
            let bal11 = await iusd.contracts.iusd.methods.balanceOf(new_user).call();
            expect((iusd.toBigN(bal01).plus(iusd.toBigN(100))).toString()).toBe(bal11);
            expect((iusd.toBigN(bal00).minus(iusd.toBigN(100))).toString()).toBe(bal10);
        });
        test("approve", async () => {
            await iusd.contracts.iusd.methods.approve(new_user, "100").send({from: user});
            let allowance = await iusd.contracts.iusd.methods.allowance(user, new_user).call();
            expect(allowance).toBe("100")
        });
        test("increaseAllowance", async () => {
            await iusd.contracts.iusd.methods.increaseAllowance(new_user, "100").send({from: user});
            let allowance = await iusd.contracts.iusd.methods.allowance(user, new_user).call();
            expect(allowance).toBe("100")
        });
        test("decreaseAllowance", async () => {
            await iusd.contracts.iusd.methods.increaseAllowance(new_user, "100").send({from: user});
            let allowance = await iusd.contracts.iusd.methods.allowance(user, new_user).call();
            expect(allowance).toBe("100")
            await iusd.contracts.iusd.methods.decreaseAllowance(new_user, "100").send({from: user});
            allowance = await iusd.contracts.iusd.methods.allowance(user, new_user).call();
            expect(allowance).toBe("0")
        });
        test("decreaseAllowance from 0", async () => {
            await iusd.contracts.iusd.methods.decreaseAllowance(new_user, "100").send({from: user});
            let allowance = await iusd.contracts.iusd.methods.allowance(user, new_user).call();
            expect(allowance).toBe("0")
        });
    })

})
