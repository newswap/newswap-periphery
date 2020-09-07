const Migrations = artifacts.require("Migrations");
const WNEW9 = artifacts.require("WNEW9");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = async function (deployer, network, accounts) {
  console.log("accounts[0]:"+accounts[0]);
  await deployer.deploy(Migrations);
  // await deployer.deploy(WNEW9);
  // var wNEW = await WNEW9.deployed();
  // var wNEWAddress = wNEW.address;
  // console.log("wNEW:"+ wNEWAddress);

  // TODO 
  if(network == "devnet"){
    console.log("deploy devnet");
    var uniswapV2FactoryAddress = "0x7F053946C99f6a17084e5aE1fd76587d43C4bb54";
    var wNEWAddress = "0x2678Fb6e5AF58f7b520aCe2Cd3A4F476b771C6f2";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else if(network == "testnet"){
    console.log("deploy testnet");
    var uniswapV2FactoryAddress = "0xd868f30Ae37591C342324f1Be44071f1852BAa10";
    var wNEWAddress = "0x6bb8F925c8474B7CbB793f557AD0aaa25552D9c2";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else { //development
    console.log("deploy development");
    var uniswapV2FactoryAddress = "0xeF68eC729A5aeD6067181e2E15436AEd19081228"; //本地truffle重启需要修改 
    // await deployer.deploy(WNEW9);
    // var wNEW = await WNEW9.deployed();
    // var wNEWAddress = wNEW.address;
    var wNEWAddress = "0x53d6188ccE03723e4954DCa87EF2dB28b72Bca18";
    console.log("wNEW:"+ wNEWAddress);
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);
  }

};
