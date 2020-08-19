const truffleAssert = require('truffle-assertions');
const abi = require('ethereumjs-abi');

const NRC6 = artifacts.require("NRC6");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const WNEW9 = artifacts.require("WNEW9");

let MT001, MT002, MT003;
let uniswapV2Factory, uniswapV2Router02, wETH;
let mt001And002PairAddress, mt002And003PairAddress, ethAndMT001PairAddress;
let deadline;

contract('Temp', (accounts) => {
  // beforeEach(async () => {
  // });

  it('init', async () => {
    // var mt0 = "0x08a2560771Af0d2C934b59F2b7C2b6F8E2155c9d";
    // var uniswapV2Pair = await IUniswapV2Pair.at("0x6d008aa105D2B93721A315D4DddF270052A981eE");
    // console.log(mt0 < "0xF7Ed458FE9899d29b8F48086d4b267D1de25C69C" ? mt0 : "0xF7Ed458FE9899d29b8F48086d4b267D1de25C69C");
    // var token0 = await uniswapV2Pair.token0()
    // console.log(token0)

    // var receipt = await web3.eth.getTransactionReceipt("0xaa67d1dd8cc8008c09cd57aa18a5dd687301ea3bbf2a3ae2e93070f55dafa89e");
		// console.log(receipt);
  
    // var number = await web3.eth.getBlockNumber();
    // // console.log(number);
    // var block = await web3.eth.getBlock(number);
    // // console.log(block.timestamp); 
    // deadline = block.timestamp * 2;
  });

});








