import { ethers } from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";

async function main() {
  // 手动设置 JSON RPC 提供者
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const signer = provider.getSigner();

  const HouseNFT = await ethers.getContractFactory("HouseNFT", signer);
  const houseNFT = await HouseNFT.deploy();
  await houseNFT.deployed();

  console.log("HouseNFT deployed to:", houseNFT.address);
}

main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});
