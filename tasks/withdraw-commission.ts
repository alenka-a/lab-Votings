import { task } from "hardhat/config";

task("withdraw-commission", "Withdraw commission")
    .addParam('contractAddress')
    .addParam("name", "voting name")
    .setAction(async (taskArgs, { ethers }) => {
        const contractAddress = ethers.utils.getAddress(taskArgs.contractAddress);
        const Votings = await ethers.getContractFactory("Votings");
        const votings = Votings.attach(contractAddress);

        await votings.withdrawCommission(taskArgs.name);    
    });