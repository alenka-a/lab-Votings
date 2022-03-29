import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Votings", function () {
  let contract: Contract;
  const votingName = "firstVoting";
  
  let candidate1: SignerWithAddress;
  let candidate2: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;

  // const [candidate1, candidate2, voter1, voter2] = new MockProvider().getWallets()  

  beforeEach(async () => {
    [candidate1, candidate2, voter1, voter2] = await ethers.getSigners();  

    const Votings = await ethers.getContractFactory("Votings");
    contract = await Votings.deploy();
    await contract.deployed();
  });

  describe("addVoting", function () {

    it("should return 2 candidates", async function () {            
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      
      let candidates = await contract.viewVotings(votingName);  
      expect(candidates[0].candidateAddress).to.equal(candidate1.address);
      expect(candidates[0].votesCount).to.equal(0);
  
      expect(candidates[1].candidateAddress).to.equal(candidate2.address);
      expect(candidates[1].votesCount).to.equal(0);
    });
  });
  
  describe("vote", function () {    
    it("should add candidates votes ", async function () {            
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);

      await contract.connect(voter1).vote(votingName, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      });
        
      let candidates = await contract.viewVotings(votingName);
  
      expect(candidates[0].candidateAddress).to.equal(candidate1.address);
      expect(candidates[0].votesCount).to.equal(1);
  
      expect(candidates[1].candidateAddress).to.equal(candidate2.address);
      expect(candidates[1].votesCount).to.equal(0);
    });

    it("You already voted. ", async function () {            
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      
      await contract.connect(voter1).vote(votingName, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      });      

      const tx = contract.connect(voter1).vote(votingName, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      });      
      await expect(tx).to.be.revertedWith("You already voted.");
    });

    it("You don't have enough balance. ", async function () {            
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      
      const voteTx = contract.connect(voter1).vote(votingName, candidate1.address, {
        value: ethers.utils.parseEther('0.001'),
      });            
      await expect(voteTx).to.be.revertedWith("You don't have enough balance.");
    });

    it("Voting finished.", async function () {            
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
      
      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
  
      await contract.connect(voter1).finish(votingName);            
      
      const voteTx = contract.connect(voter1).vote(votingName, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      });            
      await expect(voteTx).to.be.revertedWith("Voting was already finished.");
    });
  }); 
  
  describe("finish", function () {

    it("Voting can be closed only 3 days after the start.", async function () {            
      await contract.addVoting(votingName, [candidate1.address, candidate2.address]);
        
      const finishTx = contract.connect(voter1).finish(votingName);            
      await expect(finishTx).to.be.revertedWith("Voting can be closed only 3 days after the start.");
    });    
  });
});

