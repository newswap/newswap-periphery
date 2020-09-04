const NewPriceInUSD = artifacts.require("NewPriceInUSD");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(NewPriceInUSD);
};
