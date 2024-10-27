import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      // rpc url, change it according to your ganache configuration
      url: 'http://localhost:8545',
      // the private key of signers, change it according to your ganache user
      accounts: [
        '0x3bd6acc05f382d483cb7d4273d200a2b44982f288df8119025a7822d181c969e',
        '0x8379a55e4c492fd2ae42d5d244b07973de7a608e623c4d9162ec1371f6352d99',
        '0x1cc2f549e4aff2661136bdcef9c4228f7b1061c5ce30a720fc88989b22059195'
      ]
    },
  },
  paths:{
    sources:"./contracts"
  },
};

export default config;
