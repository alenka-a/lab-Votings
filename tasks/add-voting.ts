import { task } from "hardhat/config";

task("add-voting", "Creates votings")
    .addParam('contractAddress')
    .addParam("name", "voting name")
    .addParam("candidateAddresses", "Candidates")
    .setAction(async (taskArgs, { ethers }) => {
        const contractAddress = ethers.utils.getAddress(taskArgs.contractAddress);
        const Votings = await ethers.getContractFactory("Votings");
        const votings = Votings.attach(contractAddress);        
        const candidates = taskArgs.candidateAddresses.split(',');
        await votings.addVoting(taskArgs.name, candidates);        
        console.log("Voting created");        
    });