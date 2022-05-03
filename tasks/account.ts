import { task } from "hardhat/config";

task("accounts-balances")
    .setAction(async (taskArgs, { ethers }) => {
        const accounts = await ethers.getSigners();
        let num = 0;
        for (const account of accounts) {
            console.log(num, account.address);
            console.log(await account.getBalance());
            num++;
        }
    });
