import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";

dotenv.config();

import "./tasks/add-voting";
import "./tasks/view-voting";
import "./tasks/vote";
import "./tasks/finish";
import "./tasks/withdraw-commission";
import "./tasks/account";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"    
    },
    hardhat: {
    }
  },
  solidity: "0.8.4", 
  mocha: {
    timeout: 40000
  }
};

export default config;
