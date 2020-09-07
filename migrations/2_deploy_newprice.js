const NewPriceInUSD = artifacts.require("NewPriceInUSD");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(NewPriceInUSD);
  var newPriceInUSD = await NewPriceInUSD.deployed();
  console.log("newPriceInUSD:"+ newPriceInUSD.address)
};
