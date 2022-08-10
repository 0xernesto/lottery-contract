const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", () => {
    // Make sure the contract deploys
    it("deploys a conract", () => {
        assert.ok(lottery.options.address);
    });

    // Make sure the first participant can enter lottery
    it("allows one account to enter", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],                        // manager
            value: web3.utils.toWei("0.01", "ether")  // converts ether to wei (must be >= 0.01 ETH based on our contract logic)
        });

        const participants = await lottery.methods.getParticipants().call({
            from: accounts[0]  // call getParticipants() from this account (should be the manager)
        });

        assert.equal(accounts[0], participants[0]);
        assert.equal(1, participants.length);
    });

    // Make sure multiple participants can enter lottery
    it("allows multiple accounts to enter", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("0.01", "ether")
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei("0.01", "ether")
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei("0.01", "ether")
        });

        const participants = await lottery.methods.getParticipants().call({
            from: accounts[0]  // manager
        });

        assert.equal(accounts[0], participants[0]);
        assert.equal(accounts[1], participants[1]);
        assert.equal(accounts[2], participants[2]);
        assert.equal(3, participants.length);
    });

    // Make sure that participants are not accepted if they don't send >= 0.01 ETH
    it("requiers a minimum amount of ETH to enter", async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0], // manager
                value: 0           // not sending enough ETH to contract
            });
            assert(false);         // If no error is thown, this line will run, and our test will fail
        } catch (err) {
            assert(err);           // If an error is caught, assert(err) will be true, and our test will pass
        };

    });

    // Make sure that only the manager can call selectWinner()
    it("only the manager can call selectWinner()", async () => {
        try {
            await lottery.methods.selectWinner().send({
                from: accounts[1],  // not the manager
            });
            assert(false);          // If no error is thown, this line will run, and our test will fail
        } catch (err) {
            assert(err);            // If an error is caught, assert(err) will be true, and our test will pass
        };
    });

    // Make sure that money is sent to winner and that we can reset the participants array
    it("sends money to the winner and resets the participants array", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("2", "ether")
        });

        // .getBalance() returns the amount of ETH (in wei) that a given account controls
        // Can be used with either external or contract accounts
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.selectWinner().send({ from: accounts[0] });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;
        assert(difference > web3.utils.toWei("1.8", "ether")); //only gas money should be gone from account

        // Make sure that the participants array is empty
        const participants = await lottery.methods.getParticipants().call({
            from: accounts[0]  // managers
        });
        assert.equal(0, participants.length);

        // Make sure the lottery pot (contract balance) is back to zero
        const pot = await web3.eth.getBalance(lottery.options.address)
        assert.equal(0, pot);
    });
});