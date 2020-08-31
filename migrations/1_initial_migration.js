const Migrations = artifacts.require("Migrations");
const WNEW9 = artifacts.require("WNEW9");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = async function (deployer, network, accounts) {
  console.log("accounts[0]:"+accounts[0]);
  await deployer.deploy(Migrations);

  if(network == "devnet"){
    console.log("deploy devnet");
    var uniswapV2FactoryAddress = "0x999A9b54Dc8Ac3b9E7012800DF645068fC6ae288";
    var wNEWAddress = "0x202B1174Cb34ee1b3c36747901F16E8A29031684";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else if(network == "testnet"){
    console.log("deploy testnet");
    var uniswapV2FactoryAddress = "0xd868f30Ae37591C342324f1Be44071f1852BAa10";
    var wNEWAddress = "0x6bb8F925c8474B7CbB793f557AD0aaa25552D9c2";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else { //development
    console.log("deploy development");
    var uniswapV2FactoryAddress = "0x053F7abD93c272612B0A2208d1848CEF0893b826"; //本地truffle重启需要修改 
    // var wNEW = await deployer.deploy(WNEW9);
    // var wNEWAddress = wNEW.address;
    var wNEWAddress = "0x3F1A4f351A7f66bD988Bb5900CD34496ecCc5b62";
    console.log("wETH:"+ wNEWAddress);
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);
  }

};
