import { task } from "hardhat/config";

task("view-voting", "View voting")
    .addParam('contractAddress')
    .addParam("name", "Creating voting name")
    .setAction(async (taskArgs, { ethers }) => {
        const contractAddress = ethers.utils.getAddress(taskArgs.contractAddress);
        const Votings = await ethers.getContractFactory("Votings");
        const votings = Votings.attach(contractAddress);

        console.log(
            "Voting",
            (await votings.viewVoting(taskArgs.name)).toString()
        );
    });