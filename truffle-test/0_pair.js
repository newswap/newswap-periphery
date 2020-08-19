const truffleAssert = require('truffle-assertions');
const abi = require('ethereumjs-abi');

const NRC6 = artifacts.require("NRC6");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const WNEW9 = artifacts.require("WNEW9");

const MINIMUM_LIQUIDITY = 1000;

let MT001, MT002;
let uniswapV2Factory, uniswapV2Router02, wETH;
let mt001And002PairAddress, ethAndMT001PairAddress;
let deadline;

contract('Liquidity', (accounts) => {
  // beforeEach(async () => {
    // console.log(accounts[0]);
    // var balance = await web3.eth.getBalance(accounts[0]);
    // console.log(balance/1e18);
  // });

  it('init', async () => {
   // newchain devnet环境
    // uniswapV2Router02 = await UniswapV2Router02.at("");
    uniswapV2Router02 = await UniswapV2Router02.deployed();
    var uniswapV2FactoryAddress = await uniswapV2Router02.factory();
    uniswapV2Factory = await IUniswapV2Factory.at(uniswapV2FactoryAddress);  
    console.log("uniswapV2FactoryAddress:"+uniswapV2FactoryAddress);

    // deploy tokens
    MT002 = await NRC6.new("My Token 002", "MT002", 18, web3.utils.toWei("1000", 'ether'), accounts[0], {from: accounts[0]});
    MT001 = await NRC6.new("My Token 001", "MT001", 18, web3.utils.toWei("1000", 'ether'), accounts[0], {from: accounts[0]});
    console.log("mt001和mt002地址："+MT001.address + "---" + MT002.address);

    var feeTo = await uniswapV2Factory.feeTo.call();
    assert.equal(feeTo, "0x0000000000000000000000000000000000000000");
    var feeToSetter = await uniswapV2Factory.feeToSetter.call();
    assert.equal(feeToSetter, accounts[0]);
    // var allPairsLength = await uniswapV2Factory.allPairsLength.call();
    // console.log(Number(allPairsLength)); 

    var wETHAddress = await uniswapV2Router02.WETH();
    wETH = await WNEW9.at(wETHAddress);
    console.log("wETHAddress:"+wETHAddress);
    balance = await web3.eth.getBalance(wETHAddress);
    var totalSupply = await wETH.totalSupply();
    assert.equal(balance, totalSupply);

    var number = await web3.eth.getBlockNumber();
    console.log(number);
    var block = await web3.eth.getBlock(number);
    console.log(block.timestamp); 
    deadline = block.timestamp * 2;
  });

  it('check token', async () => {
    const symbol = await MT001.symbol();
    assert.equal(symbol, 'MT001');
    const totalSupply = await MT001.totalSupply();
    assert.equal(totalSupply/1e18, 1000);
    const balance = await MT001.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 1000);

    const symbol2 = await MT002.symbol();
    assert.equal(symbol2, 'MT002');
    const totalSupply2 = await MT002.totalSupply();
    assert.equal(totalSupply2/1e18, 1000);
    const balance2 = await MT002.balanceOf.call(accounts[0]);
    assert.equal(balance2/1e18, 1000);
  });


    ///////////////////////////////////////////////////
    //          CREATE PAIR                          //
    ///////////////////////////////////////////////////  

  it('createMT001AndMT002Pair', async () => {
    // 已为MT001和MT002创建交易对
    var tx = await uniswapV2Factory.createPair(MT001.address, MT002.address);
    // console.log(tx);
    // console.log(tx.logs);
    // var eventPairCreated= '0x' + abi.soliditySHA3(['string'], ["PairCreated(address,address,address,uint256)"]).toString("hex");
    // // console.log(eventPairCreated);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventPairCreated));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["address","uint256"],log.data);
    //   console.log(data);         
    // }

    mt001And002PairAddress = await uniswapV2Factory.getPair(MT001.address, MT002.address);
    console.log("getPair:"+mt001And002PairAddress);
    // TODO pairFor需要删除
    var pairFor = await uniswapV2Router02.pairFor(MT001.address, MT002.address);
    console.log("pairFor:" + pairFor);
    assert.equal(pairFor, mt001And002PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    const factory = await uniswapV2Pair.factory();
    assert.equal(factory, uniswapV2Factory.address);

    const reserves = await uniswapV2Pair.getReserves();
    assert.equal(Number(reserves[0]), 0);
    assert.equal(Number(reserves[1]), 0);
  });

  it('createETHAndMT001Pair', async () => {
    // 已为MT001和WETH创建交易对
    var tx = await uniswapV2Factory.createPair(MT001.address, wETH.address);
    // console.log(tx);
    // console.log(tx.logs);
    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    // console.log(ethAndMT001PairAddress);
    var pairFor = await uniswapV2Router02.pairFor(MT001.address, wETH.address);
    assert.equal(pairFor, ethAndMT001PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    const factory = await uniswapV2Pair.factory();
    assert.equal(factory, uniswapV2Factory.address);

    const reserves = await uniswapV2Pair.getReserves();
    assert.equal(Number(reserves[0]), 0);
    assert.equal(Number(reserves[1]), 0);
  });

});















