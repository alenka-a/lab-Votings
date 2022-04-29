import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Votings", function () {
  let contract: Contract;
  const votingName = "firstVoting";

  let owner: SignerWithAddress;
  let candidate1: SignerWithAddress;
  let candidate2: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;

  let name;
  let candidates;
  let startTime;
  let finished;
  let amount;

  const voteFee = ethers.utils.parseEther('0.01');

  beforeEach(async () => {
    [owner, candidate1, candidate2, voter1, voter2] = await ethers.getSigners();

    const Votings = await ethers.getContractFactory("Votings");
    contract = await Votings.deploy();
    await contract.deployed();
  });

  describe("addVoting", function () {
    it("Should return 2 candidates", async function () {

      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);

      [name, candidates, startTime, finished, amount] = await contract.viewVoting(votingName);
      expect(candidates[0].candidateAddress).to.equal(candidate1.address);
      expect(candidates[0].votesCount).to.equal(0);
      expect(candidates[1].candidateAddress).to.equal(candidate2.address);
      expect(candidates[1].votesCount).to.equal(0);
    });

    it("Should fail with error: Only owner can create voting. ", async function () {    
      const tx = contract.connect(voter1).addVoting(votingName, [candidate1.address, candidate2.address]);

      await expect(tx).to.be.revertedWith("Only owner can create voting.");
    });

  });

  describe("vote", function () {
    it("Should add candidates votes ", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);

      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });

      [name, candidates, startTime, finished, amount] = await contract.viewVoting(votingName);
      expect(candidates[0].candidateAddress).to.equal(candidate1.address);
      expect(candidates[0].votesCount).to.equal(1);
      expect(candidates[1].candidateAddress).to.equal(candidate2.address);
      expect(candidates[1].votesCount).to.equal(0);
    });

    it("Should fail with error: You already voted. ", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee });

      const tx = contract.connect(voter1).vote(votingName, 0, { value: voteFee });

      await expect(tx).to.be.revertedWith("You already voted.");
    });

    it("Should fail with error: You don't have enough balance. ", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);

      const voteTx = contract.connect(voter1).vote(votingName, 0, { value: ethers.utils.parseEther('0.001') });

      await expect(voteTx).to.be.revertedWith("You don't have enough balance.");
    });

    it("Should fail with error: Voting was already finished.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await contract.connect(voter1).finish(votingName);

      const voteTx = contract.connect(voter1).vote(votingName, 0, { value: voteFee });

      await expect(voteTx).to.be.revertedWith("Voting was already finished.");
    });

    it("Should fail with error: Not correct candidate id. ", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);

      const tx = contract.connect(voter1).vote(votingName, 10, { value: voteFee });

      await expect(tx).to.be.revertedWith("Not correct candidate id.");
    });
  });

  describe("finish", function () {

    it("Should fail with error: Voting can be closed only 3 days after the start.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);

      const finishTx = contract.connect(voter1).finish(votingName);

      await expect(finishTx).to.be.revertedWith("Voting can be closed only 3 days after the start.");
    });

    it("The reward must be transferred to the winner.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);

      const finishTx = contract.connect(voter1).finish(votingName);

      await expect(await finishTx).to.changeEtherBalance(candidate1, ethers.utils.parseEther('0.009'));
    });

    it("Should fail with error: Voting was already finished.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await contract.connect(voter1).finish(votingName);

      const finishTx = contract.connect(voter1).finish(votingName);

      await expect(finishTx).to.be.revertedWith("Voting was already finished.");
    });

  });

  describe("winningCandidate", function () {

    it("Should return first candidate ", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });
      await contract.connect(voter2).vote(votingName, 0, { value: voteFee, });

      let winnerAddres = await contract.winningCandidate(votingName);

      expect(winnerAddres).to.equal(candidate1.address);
    });
  });

  describe("withdrawCommission", function () {

    it("Should withdraw commission to owner", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await contract.connect(voter1).finish(votingName);

      const withdrawTx = contract.withdrawCommission(votingName);

      await expect(await withdrawTx).to.changeEtherBalance(owner, ethers.utils.parseEther('0.001'));
    });

    it("Should fail with error: The commission has already been withdrawn.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await contract.connect(voter1).finish(votingName);
      await contract.withdrawCommission(votingName);

      const withdrawTx = contract.withdrawCommission(votingName);

      await expect(withdrawTx).to.be.revertedWith("The commission has already been withdrawn.");
    });

    it("Should fail with error: Voting should be finished.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);

      const withdrawTx = contract.withdrawCommission(votingName);

      await expect(withdrawTx).to.be.revertedWith("Voting should be finished.");
    });

    it("Should fail with error: Only owner can withdraw commission.", async function () {
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      await contract.connect(voter1).vote(votingName, 0, { value: voteFee, });
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await contract.connect(voter1).finish(votingName);

      const withdrawTx = contract.connect(voter2).withdrawCommission(votingName);

      await expect(withdrawTx).to.be.revertedWith("Only owner can withdraw commission.");
    });
  });
});