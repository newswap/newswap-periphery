const Migrations = artifacts.require("Migrations");
const WNEW9 = artifacts.require("WNEW9");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = async function (deployer, network, accounts) {
  console.log("accounts[0]:"+accounts[0]);
  await deployer.deploy(Migrations);

  if(network == "devnet"){
    console.log("deploy devnet");
    var uniswapV2FactoryAddress = "0xe8b77580c98c21CCC454707a9253215A6cCDfa4F";
    var wNEWAddress = "0x592685288531A4433005929561C8a0C4BdcC98D0";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else if(network == "testnet"){
    console.log("deploy testnet");
    var uniswapV2FactoryAddress = "0xd868f30Ae37591C342324f1Be44071f1852BAa10";
    var wNEWAddress = "0x6bb8F925c8474B7CbB793f557AD0aaa25552D9c2";
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEWAddress);

  } else { //development
    console.log("deploy development");
    var uniswapV2FactoryAddress = "0x0BE037cc9A145c9430d8E51CbcA0edc4Ac4fccC5"; //本地truffle重启需要修改 
    var wNEW = await deployer.deploy(WNEW9);
    console.log("wETH:"+ wNEW.address);
    await deployer.deploy(UniswapV2Router02, uniswapV2FactoryAddress, wNEW.address);
  }

};
