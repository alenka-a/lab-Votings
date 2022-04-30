import { task } from "hardhat/config";

task("finish", "Finish")
    .addParam('contractAddress')
    .addParam("name", "voting name")
    .addParam('finisherAddress')
    .setAction(async (taskArgs, { ethers }) => {
        const contractAddress = ethers.utils.getAddress(taskArgs.contractAddress);
        const Votings = await ethers.getContractFactory("Votings");
        const votings = Votings.attach(contractAddress);

        const finisher = await ethers.getSigner(taskArgs.finisherAddress);

        await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
        await votings.connect(finisher).finish(taskArgs.name);

        console.log("Winner", (await votings.winningCandidate(taskArgs.name)).toString());
    });