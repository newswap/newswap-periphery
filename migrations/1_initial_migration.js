const Migrations = artifacts.require("Migrations");
const WETH9 = artifacts.require("WETH9");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = function (deployer, network, accounts) {
  console.log("accounts[0]:"+accounts[0]);
  deployer.deploy(Migrations);

  // uniswapV2FactoryAddress 改成本地部署
  var uniswapV2FactoryAddress = "0x08420dF55D008Cdfa929E7b7159f468817ce11e4"; //本地truffle重启需要修改 
  if(network == "devnet"){
    uniswapV2FactoryAddress = "0x999A9b54Dc8Ac3b9E7012800DF645068fC6ae288";
  }

  console.log("uniswapV2Factory:" + uniswapV2FactoryAddress);
  deployer.deploy(WETH9).then(function (instance) {
    registryImplAddress = instance.address;

    return deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, instance.address);
  });
};
