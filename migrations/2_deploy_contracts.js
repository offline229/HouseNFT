const HouseNFT = artifacts.require("HouseNFT");

module.exports = function (deployer) {
  deployer.deploy(HouseNFT);
};
