const truffleAssert = require('truffle-assertions');
const abi = require('ethereumjs-abi');

const NRC6 = artifacts.require("NRC6");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const WNEW9 = artifacts.require("WNEW9");
const TestRouter = artifacts.require("TestRouter");

let MT001, MT002, MT003;
let uniswapV2Factory, uniswapV2Router02, wETH;
let mt001And002PairAddress, mt002And003PairAddress, ethAndMT001PairAddress;
let deadline, testRouter;

contract('SWAP', (accounts) => {
  // beforeEach(async () => {
  // });

  it('init', async () => {
   // newchain devnet环境
    // uniswapV2Router02 = await UniswapV2Router02.at("");
    uniswapV2Router02 = await UniswapV2Router02.deployed();
    var uniswapV2FactoryAddress = await uniswapV2Router02.factory();
    uniswapV2Factory = await IUniswapV2Factory.at(uniswapV2FactoryAddress);  
    console.log("uniswapV2FactoryAddress:"+uniswapV2FactoryAddress);

    testRouter = await TestRouter.new();

    // deploy tokens
    MT001 = await NRC6.new("My Token 001", "MT001", 18, web3.utils.toWei("1000", 'ether'), accounts[0], {from: accounts[0]});
    MT002 = await NRC6.new("My Token 002", "MT002", 18, web3.utils.toWei("1000", 'ether'), accounts[0], {from: accounts[0]});
    MT003 = await NRC6.new("My Token 003", "MT003", 18, web3.utils.toWei("1000", 'ether'), accounts[0], {from: accounts[0]});
    console.log("mt001/002/003地址：" + MT001.address + "---" + MT002.address + "---" + MT003.address);

    var wETHAddress = await uniswapV2Router02.WETH();
    console.log("wETHAddress:"+wETHAddress);
    wETH = await WNEW9.at(wETHAddress);

    var number = await web3.eth.getBlockNumber();
    console.log(number);
    var block = await web3.eth.getBlock(number);
    console.log(block.timestamp); 
    deadline = block.timestamp * 2;
  });

    ///////////////////////////////////////////////////
    //          ADD LIQUIDITY                        //
    /////////////////////////////////////////////////// 
  it('addLiquidity for MT001AndMT002Pair', async () => {
    const token1Amount = web3.utils.toWei("50", 'ether');
    const token2Amount = web3.utils.toWei("100", 'ether');

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    await MT002.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));  
    
    mt001And002PairAddress = await uniswapV2Factory.getPair(MT001.address, MT002.address);
    console.log("mt001And002PairAddress: " + mt001And002PairAddress);
    // // var tx = await uniswapV2Factory.createPair(MT001.address, MT002.address);
    // // console.log(tx);
    // // console.log(tx.logs);
    // mt001And002PairAddress = await uniswapV2Factory.getPair(MT001.address, MT002.address);
    // console.log(mt001And002PairAddress);

    var tx = await uniswapV2Router02.addLiquidity(MT001.address, MT002.address, token1Amount, token2Amount, 0, 0, accounts[0], deadline, {gas: 2999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);
    mt001And002PairAddress = await uniswapV2Factory.getPair(MT001.address, MT002.address);
    console.log("mt001And002PairAddress: " + mt001And002PairAddress);

    var pairFor = await testRouter.pairFor(uniswapV2Factory.address, MT001.address, MT002.address);
    assert.equal(mt001And002PairAddress,pairFor)

    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? Number(token1Amount) : Number(token2Amount));
    assert.equal(Number(reserves[1]), MT001.address == token0 ? Number(token2Amount) : Number(token1Amount));
  });

  it('addLiquidity for MT002AndMT003Pair', async () => {
    const token1Amount = web3.utils.toWei("50", 'ether');
    const token2Amount = web3.utils.toWei("100", 'ether');

    await MT002.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    await MT003.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));  
    
    var tx = await uniswapV2Router02.addLiquidity(MT002.address, MT003.address, token1Amount, token2Amount, 0, 0, accounts[0], deadline, {gas: 3999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);
    mt002And003PairAddress = await uniswapV2Factory.getPair(MT002.address, MT003.address);
    console.log("mt002And003PairAddress: " + mt002And003PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(mt002And003PairAddress);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT002.address == token0 ? Number(token1Amount) : Number(token2Amount));
    assert.equal(Number(reserves[1]), MT002.address == token0 ? Number(token2Amount) : Number(token1Amount));
  });

  it('addLiquidity for ETHAndMT001Pair', async () => {
    const token1Amount = web3.utils.toWei("50", 'ether');
    const ethAmount = web3.utils.toWei("1", 'ether');

    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    console.log("ethAndMT001PairAddress: " + ethAndMT001PairAddress);
    
    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    // 如果没有交易对此处会自动创建
    var tx = await uniswapV2Router02.addLiquidityETH(MT001.address, token1Amount, 0, 0, accounts[0], deadline, {value: web3.utils.toWei("1", 'ether'), gas: 3999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);
    // 多了1个eth
    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    console.log("ethAndMT001PairAddress: " + ethAndMT001PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? Number(token1Amount) : Number(ethAmount));
    assert.equal(Number(reserves[1]), MT001.address == token0 ? Number(ethAmount) : Number(token1Amount));
  });

    ///////////////////////////////////////////////////
    //               SWAP(6种情况)                    //
    /////////////////////////////////////////////////// 
  it('1.swapExactTokensForTokens: MT001->MT002', async () => {
    //确定输入的MT001数量，获得指定兑换MT002为输出， 滑点设置为最少输出量
    const swapMT001Amount = web3.utils.toWei("1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveMT002 = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + Number(reserveMT001)); //50
    console.log("reserveMT002: " + Number(reserveMT002)); //100

    // 两种方式获得预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapMT001Amount, [MT001.address, MT002.address]);
    console.log("输入mt001值：" + Number(amounts[0]));
    console.log("预计获得mt002数量为：" + Number(amounts[1]));
    var amountOut = await uniswapV2Router02.getAmountOut(swapMT001Amount, reserveMT001, reserveMT002);
    console.log("预计获得mt002数量为：" + Number(amountOut));

    // 设置1%的滑点
    var amountOutMin = amountOut * 0.99;
    console.log("设置1%的滑点，最少获得mt002: " + Number(amountOutMin));

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await MT002.balanceOf.call(accounts[0]);
    console.log(Number(balance));

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapExactTokensForTokens(swapMT001Amount, web3.utils.toWei(amountOutMin+"","wei"), [MT001.address, MT002.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await MT002.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

  it('2.swapExactTokensForTokens: MT001->MT002->MT003', async () => {
    //确定输入的MT001数量，获得指定兑换MT003为输出， 滑点设置为最少输出量
    const swapMT001Amount = web3.utils.toWei("1", 'ether');

    var uniswapV2Pair1 = await IUniswapV2Pair.at(mt001And002PairAddress);
    var reserves = await uniswapV2Pair1.getReserves();
    var token0 = await uniswapV2Pair1.token0();
    console.log(token0);
    console.log("reserve0: " + Number(reserves[0])); 
    console.log("reserve1: " + Number(reserves[1])); 
    var uniswapV2Pair2 = await IUniswapV2Pair.at(mt002And003PairAddress);
    reserves = await uniswapV2Pair2.getReserves();
    token0 = await uniswapV2Pair2.token0();
    console.log(token0);
    console.log("reserve0: " + Number(reserves[0])); 
    console.log("reserve1: " + Number(reserves[1])); 


    var amounts = await uniswapV2Router02.getAmountsOut(swapMT001Amount, [MT001.address, MT002.address, MT003.address]);
    console.log("输入mt001值：" + Number(amounts[0]));
    console.log("中间变量mt002数量为：" + Number(amounts[1]));
    console.log("预计获得mt003数量为：" + Number(amounts[2]));

    // 设置1%的滑点
    var amountOutMin = amounts[2] * 0.99;
    console.log("设置1%的滑点，最少获得mt003: " + Number(amountOutMin));

    // console.log("交易前余额");
    // var balance = await MT001.balanceOf.call(accounts[0]);
    // console.log(Number(balance));
    // balance = await MT003.balanceOf.call(accounts[0]);
    // console.log(Number(balance));

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapExactTokensForTokens(swapMT001Amount, web3.utils.toWei(amountOutMin+"","wei"), [MT001.address, MT002.address, MT003.address], accounts[0], deadline, {gas: 6000000});
    console.log(tx);
    console.log(tx.logs);  
    console.log(tx.receipt.rawLogs);

    // 多个？？？？
    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await MT003.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair1.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
    reserves = await uniswapV2Pair2.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

  it('3.swapTokensForExactTokens: MT001->MT002', async () => {
    //确定输出的MT002数量，获得需消耗MT001量， 滑点设置为MT001最大消耗量
    const outputAmount = web3.utils.toWei("1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    // console.log(token0);
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveMT002 = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + Number(reserveMT001)); 
    console.log("reserveMT002: " + Number(reserveMT002));

    // 2种方式获得需消耗MT001量
    var amountIn = await uniswapV2Router02.getAmountIn(outputAmount, reserveMT001, reserveMT002);
    console.log("预计需消耗mt001数量为：" + Number(amountIn));
    var amounts = await uniswapV2Router02.getAmountsIn(outputAmount, [MT001.address, MT002.address]);
    console.log("预计需消耗mt001数量为：" + Number(amounts[0]));
    console.log("输出mt002值：" + Number(amounts[1]));

    // 设置1%的滑点
    var amountInMax = amountIn * 1.01;
    console.log("设置1%的滑点，mt001最大消耗量: " + Number(amountInMax));

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await MT002.balanceOf.call(accounts[0]);
    console.log(Number(balance));

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapTokensForExactTokens(outputAmount, web3.utils.toWei(amountInMax+"","wei"), [MT001.address, MT002.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await MT002.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

  it('4.swapExactTokensForETH: MT001->ETH', async () => {
    //确定输入的MT001数量，获得指定兑换ETH为输出， 滑点设置为最少输出量
    const swapMT001Amount = web3.utils.toWei("1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    console.log(token0);
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveWETH = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + Number(reserveMT001)); //4
    console.log("reserveWETH: " + Number(reserveWETH)); //1

    // 两种方式获得预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapMT001Amount, [MT001.address, wETH.address]);
    console.log("输入mt001值：" + Number(amounts[0]));
    console.log("预计获得ETH数量为：" + Number(amounts[1]));
    var amountOut = await uniswapV2Router02.getAmountOut(swapMT001Amount, reserveMT001, reserveWETH);
    console.log("预计获得ETH数量为：" + Number(amountOut));

    // 设置1%的滑点
    var amountOutMin = amountOut * 0.99;
    console.log("设置1%的滑点，最少获得ETH: " + Number(amountOutMin));

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapExactTokensForETH(swapMT001Amount, web3.utils.toWei(amountOutMin+"","wei"), [MT001.address, wETH.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

  it('5.swapExactTokensForETH：MT002->MT001->ETH', async () => {
    //确定输入的MT002数量，获得指定兑换ETH为输出， 滑点设置为最少输出量
    const swapMT002Amount = web3.utils.toWei("1", 'ether');

    // var uniswapV2Pair1 = await IUniswapV2Pair.at(mt001And002PairAddress);
    // var reserves = await uniswapV2Pair1.getReserves();
    // var token0 = await uniswapV2Pair1.token0();
    // console.log(token0);
    // console.log("reserve0: " + Number(reserves[0])); 
    // console.log("reserve1: " + Number(reserves[1])); 
    // var uniswapV2Pair2 = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    // reserves = await uniswapV2Pair2.getReserves();
    // token0 = await uniswapV2Pair2.token0();
    // console.log(token0);
    // console.log("reserve0: " + Number(reserves[0])); 
    // console.log("reserve1: " + Number(reserves[1])); 

    // 预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapMT002Amount, [MT002.address, MT001.address, wETH.address]);
    console.log("输入mt002值：" + Number(amounts[0]));
    console.log("中间变量mt001数量为：" + Number(amounts[1]));
    console.log("预计获得ETH数量为：" + Number(amounts[2]));

    // 设置1%的滑点
    var amountOutMin = amounts[2] * 0.99;
    console.log("设置1%的滑点，最少获得ETH: " + Number(amountOutMin));

    console.log("交易前余额");
    var balance = await MT002.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));

    await MT002.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapExactTokensForETH(swapMT002Amount, web3.utils.toWei(amountOutMin+"","wei"), [MT002.address, MT001.address, wETH.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    // 会有多个
    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT002.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));
    // var reserves = await uniswapV2Pair1.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // reserves = await uniswapV2Pair2.getReserves();
    // console.log("reserve0: " + Number(reserves[0]));
    // console.log("reserve1: " + Number(reserves[1]));
  });

  it('6.swapETHForExactTokens: ETH->MT001', async () => {
    //确定输出的MT001数量，获得需消耗ETH量， 滑点设置为ETH最大消耗量
    const outputAmount = web3.utils.toWei("1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    // console.log(token0);
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveWETH = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + Number(reserveMT001)); //4
    console.log("reserveWETH: " + Number(reserveWETH));   //1

    // 2种方式获得需消耗ETH量
    var amountIn = await uniswapV2Router02.getAmountIn(outputAmount, reserveWETH, reserveMT001);
    console.log("预计需消耗eth数量为：" + Number(amountIn));
    var amounts = await uniswapV2Router02.getAmountsIn(outputAmount, [wETH.address, MT001.address]);
    console.log("预计需消耗eth数量为：" + Number(amounts[0]));
    console.log("输出mt001值：" + Number(amounts[1]));

    // 设置1%的滑点
    var amountInMax = amountIn * 1.01; // 1%滑点
    console.log("设置1%的滑点，eth最大消耗量: " + Number(amountInMax)); // 多给的eth会退回  todo测试下*1是否会报错？？？

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));

    var tx = await uniswapV2Router02.swapETHForExactTokens(outputAmount, [wETH.address, MT001.address], accounts[0], deadline, {value: web3.utils.toWei(amountInMax+"","wei"), gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

  it('7.swapExactETHForTokens: ETH->MT001', async () => {
    //确定输入的ETH数量，获得mt001为输出， 滑点设置为最少输出量
    const swapETHAmount = web3.utils.toWei("0.1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    console.log(token0);
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveWETH = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + Number(reserveMT001)); //4
    console.log("reserveWETH: " + Number(reserveWETH)); //1

    // 两种方式获得预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapETHAmount, [wETH.address, MT001.address]);
    console.log("输入eth值：" + Number(amounts[0]));
    console.log("预计获得mt001数量为：" + Number(amounts[1]));
    var amountOut = await uniswapV2Router02.getAmountOut(swapETHAmount, reserveWETH, reserveMT001);
    console.log("预计获得mt001数量为：" + Number(amountOut));

    // 设置1%的滑点
    var amountOutMin = amountOut * 0.99;
    console.log("设置1%的滑点，最少获得mt001: " + Number(amountOutMin));

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));

    var tx = await uniswapV2Router02.swapExactETHForTokens(web3.utils.toWei(amountOutMin+"","wei"), [wETH.address, MT001.address], accounts[0], deadline, {value: swapETHAmount, gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

  it('8.swapExactETHForTokens: ETH->MT001->MT002->MT003', async () => {
    //确定输入的ETH数量，获得mt003为输出， 滑点设置为最少输出量
    const swapETHAmount = web3.utils.toWei("0.1", 'ether');

    // 获得预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapETHAmount, [wETH.address, MT001.address, MT002.address, MT003.address]);
    console.log("输入eth值：" + Number(amounts[0]));
    console.log("中间变量mt001数量为：" + Number(amounts[1]));
    console.log("中间变量mt002数量为：" + Number(amounts[2]));
    console.log("预计获得mt003数量为：" + Number(amounts[3]));

    // 设置1%的滑点
    var amountOutMin = amounts[3] * 0.99;
    console.log("设置1%的滑点，最少获得mt003: " + Number(amountOutMin));

    // console.log("交易前余额");
    // var balance = await MT003.balanceOf.call(accounts[0]);
    // console.log(Number(balance));
    // balance = await web3.eth.getBalance(accounts[0]);
    // console.log(Number(balance));

    var tx = await uniswapV2Router02.swapExactETHForTokens(web3.utils.toWei(amountOutMin+"","wei"), [wETH.address, MT001.address, MT002.address, MT003.address], accounts[0], deadline, {value: swapETHAmount, gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    // 会有多个
    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT003.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));
  });

  it('9.swapTokensForExactETH: MT001->ETH', async () => {
    //确定输出的ETH数量，获得需消耗MT001量， 滑点设置为MT001最大消耗量
    const outputAmount = web3.utils.toWei("0.1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    // console.log(token0);
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveWETH = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + Number(reserveMT001)); //4
    console.log("reserveWETH: " + Number(reserveWETH));   //1

    // 2种方式获得需消耗ETH量
    var amountIn = await uniswapV2Router02.getAmountIn(outputAmount, reserveMT001, reserveWETH);
    console.log("预计需消耗MT001数量为：" + Number(amountIn));
    var amounts = await uniswapV2Router02.getAmountsIn(outputAmount, [MT001.address, wETH.address]);
    console.log("预计需消耗MT001数量为：" + Number(amounts[0]));
    console.log("输出ETH值：" + Number(amounts[1]));

    // 设置1%的滑点
    var amountInMax = amountIn * 1.01; // 1%滑点
    console.log("设置1%的滑点，MT001最大消耗量: " + Number(amountInMax));

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapTokensForExactETH(outputAmount, web3.utils.toWei(amountInMax+"","wei"), [MT001.address, wETH.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // console.log(eventSwap);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
      console.log(data);         
    }
    var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // console.log(eventSync);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // console.log(log);
    if(log){
      var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
      console.log(data);         
    }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(Number(balance));
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(Number(balance));
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + Number(reserves[0])); //mt002
    console.log("reserve1: " + Number(reserves[1])); //mt001
  });

// TODO 
  //swapExactTokensForTokensSupportingFeeOnTransferTokens
  //swapExactETHForTokensSupportingFeeOnTransferTokens
  //swapExactTokensForETHSupportingFeeOnTransferTokens

});















