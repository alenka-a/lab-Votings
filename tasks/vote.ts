import { task } from "hardhat/config";

task("vote", "Vote")
    .addParam('contractAddress')
    .addParam('voterAddress')
    .addParam("name", "voting name")
    .addParam("candidateId")
    .addParam("voteFee")
    .setAction(async (taskArgs, { ethers }) => {
        const contractAddress = ethers.utils.getAddress(taskArgs.contractAddress);
        const Votings = await ethers.getContractFactory("Votings");
        const votings = Votings.attach(contractAddress);

        const voter = await ethers.getSigner(taskArgs.voterAddress);

        const voteFee = ethers.utils.parseEther(taskArgs.voteFee);        
        await votings.connect(voter).vote(taskArgs.name, taskArgs.candidateId, { value: voteFee });
    });