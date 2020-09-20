const Migrations = artifacts.require("Migrations");
const WNEW9 = artifacts.require("WNEW9");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = async function (deployer, network, accounts) {
  // console.log("accounts[0]:"+accounts[0]);
  // await deployer.deploy(Migrations);
  // await deployer.deploy(WNEW9);
  // // var wNEW = await WNEW9.deployed();
  // // var wNEWAddress = wNEW.address;
  // // console.log("wNEW:"+ wNEWAddress);

  if(network == "devnet"){
    console.log("deploy devnet");
    var uniswapV2FactoryAddress = "0x7F053946C99f6a17084e5aE1fd76587d43C4bb54";
    var wNEWAddress = "0x2678Fb6e5AF58f7b520aCe2Cd3A4F476b771C6f2";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else if(network == "testnet"){
    console.log("deploy testnet");
    var uniswapV2FactoryAddress = "0xCe59bbCFe029789af935DFF388Fb65771e2845B2";
    var wNEWAddress = "0x55D1cf675D4618B7ba371FAA3Ff4f559D0f5c6d9";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else { //development
    console.log("deploy development");
    var uniswapV2FactoryAddress = "0x46E3810B27d49d26fad216172F4244D05003e6AD"; //本地truffle重启需要修改 
    await deployer.deploy(WNEW9);
    var wNEW = await WNEW9.deployed();
    var wNEWAddress = wNEW.address;
    // var wNEWAddress = "0x53d6188ccE03723e4954DCa87EF2dB28b72Bca18";
    console.log("wNEW:"+ wNEWAddress);
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);
  }

};
