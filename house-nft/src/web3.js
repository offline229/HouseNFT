import Web3 from 'web3';
import Addresses from './contracts/contract-addresses.json';
import HouseNFT from './contracts/HouseNFT.json';

// 检查 MetaMask 的注入情况
let web3;
if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
        // 请求用户授权
        window.ethereum.enable();
    } catch (error) {
        console.error("用户拒绝了访问请求");
    }
} else {
    console.warn("MetaMask 未安装！使用本地 Ganache 地址");
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// 获取合约的 ABI 和地址
const houseNFTABI = HouseNFT.abi;
const houseNFTAddress = Addresses.HouseNFT;

// 创建合约实例
const houseNFTContract = new web3.eth.Contract(houseNFTABI, houseNFTAddress);

export { web3, houseNFTContract };
