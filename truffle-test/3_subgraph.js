const truffleAssert = require('truffle-assertions');
const abi = require('ethereumjs-abi');

const NRC6 = artifacts.require("NRC6");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const WNEW9 = artifacts.require("WNEW9");

let MT001, MT002;
let uniswapV2Factory, uniswapV2Router02, wETH;
let ethAndMT001PairAddress, ethAndMT002PairAddress;
let deadline;

// TODO 用于子图数据测试～～～不需要token-token交易对，只关注new-token交易对！！
contract('Subgraph', (accounts) => {
  it('init', async () => {
    uniswapV2Router02 = await UniswapV2Router02.deployed();
    var uniswapV2FactoryAddress = await uniswapV2Router02.factory();
    uniswapV2Factory = await IUniswapV2Factory.at(uniswapV2FactoryAddress);  
    console.log("uniswapV2FactoryAddress:"+uniswapV2FactoryAddress);

    // deploy tokens
    MT001 = await NRC6.new("My Token 001", "MT001", 18, web3.utils.toWei("10000", 'ether'), accounts[0], {from: accounts[0]});
    MT002 = await NRC6.new("My Token 002", "MT002", 18, web3.utils.toWei("10000", 'ether'), accounts[0], {from: accounts[0]});
    console.log("mt001/002地址：" + MT001.address + "---" + MT002.address);

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
  it('addLiquidity for ETHAndMT001Pair', async () => {
    const tokenAmount = web3.utils.toWei("5000", 'ether');
    const ethAmount = web3.utils.toWei("1", 'ether');

    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    console.log("ethAndMT001PairAddress: " + ethAndMT001PairAddress);

    await MT001.approve(uniswapV2Router02.address, tokenAmount);
    // 如果没有交易对此处会自动创建
    var tx = await uniswapV2Router02.addLiquidityETH(MT001.address, tokenAmount, 0, 0, accounts[0], deadline, {value: ethAmount, gas: 3999999});

    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    console.log("ethAndMT001PairAddress: " + ethAndMT001PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? Number(tokenAmount) : Number(ethAmount));
    assert.equal(Number(reserves[1]), MT001.address == token0 ? Number(ethAmount) : Number(tokenAmount));
  });

  it('addLiquidity for ETHAndMT002Pair', async () => {
    const tokenAmount = web3.utils.toWei("1000", 'ether');
    const ethAmount = web3.utils.toWei("1", 'ether');

    await MT002.approve(uniswapV2Router02.address, tokenAmount);
    // 如果没有交易对此处会自动创建
    var tx = await uniswapV2Router02.addLiquidityETH(MT002.address, tokenAmount, 0, 0, accounts[0], deadline, {value: ethAmount, gas: 3999999});
    ethAndMT002PairAddress = await uniswapV2Factory.getPair(MT002.address, wETH.address);
    console.log("ethAndMT002PairAddress: " + ethAndMT002PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT002PairAddress);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT002.address == token0 ? Number(tokenAmount) : Number(ethAmount));
    assert.equal(Number(reserves[1]), MT002.address == token0 ? Number(ethAmount) : Number(tokenAmount));
  });


  it('addLiquidity for ETHAndMT002Pair again', async () => {
    console.log("ethAndMT002PairAddress: " + ethAndMT002PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT002PairAddress);
    // 确定eth的量，查询需要输入的token量
    const ethAmount = web3.utils.toWei("1", 'ether');
    const reserves = await uniswapV2Pair.getReserves();
    const tokenReserve = MT002.address < wETH.address ? reserves[0] : reserves[1];
    const wETHReserve = MT002.address < wETH.address? reserves[1] : reserves[0];
    // 获得需要的token量
    var tokenAmount = await uniswapV2Router02.quote(ethAmount, wETHReserve, tokenReserve);
    assert.equal(Number(tokenAmount)/1e18, 1000);

    await MT002.approve(uniswapV2Router02.address, tokenAmount);
    // 如果没有交易对此处会自动创建
    var tx = await uniswapV2Router02.addLiquidityETH(MT002.address, tokenAmount, 0, 0, accounts[0], deadline, {value: ethAmount, gas: 3999999});

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT002PairAddress);
    const reserves2 = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(reserves2[0]/1e18, MT002.address == token0 ? 1500 :15);
    assert.equal(reserves2[1]/1e18, MT002.address == token0 ? 15 : 1500);
  });

  //   ///////////////////////////////////////////////////
  //   //           SWAP(测试3中情况)                    //
  //   /////////////////////////////////////////////////// 

  it('1.swapExactETHForTokens: ETH->MT001', async () => {
    //确定输入的ETH数量，获得mt001为输出， 滑点设置为最少输出量
    const swapETHAmount = web3.utils.toWei("0.1", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveWETH = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + reserveMT001/1e18);
    console.log("reserveWETH: " + reserveWETH/1e18);

    // 两种方式获得预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapETHAmount, [wETH.address, MT001.address]);
    console.log("输入eth值：" + amounts[0]/1e18);
    console.log("预计获得mt001数量为：" + amounts[1]/1e18);
    var amountOut = await uniswapV2Router02.getAmountOut(swapETHAmount, reserveWETH, reserveMT001);
    console.log("预计获得mt001数量为：" + amountOut/1e18);

    // 设置1%的滑点
    var amountOutMin = amountOut * 0.99;
    console.log("设置1%的滑点，最少获得mt001: " + Number(amountOutMin));

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(balance/1e18);

    var tx = await uniswapV2Router02.swapExactETHForTokens(web3.utils.toWei(amountOutMin+"","wei"), [wETH.address, MT001.address], accounts[0], deadline, {value: swapETHAmount, gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    // var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // // console.log(eventSwap);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
    //   console.log(data);         
    // }
    // var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // // console.log(eventSync);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
    //   console.log(data);         
    // }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(balance/1e18);
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + reserves[0]/1e18); 
    console.log("reserve1: " + reserves[1]/1e18); 
  });

  it('2.swapExactTokensForETH: MT001->ETH', async () => {
    //确定输入的MT001数量，获得指定兑换ETH为输出， 滑点设置为最少输出量
    const swapMT001Amount = web3.utils.toWei("100", 'ether');

    // 先查下下预计可以得到多少个
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var reserves = await uniswapV2Pair.getReserves();
    // console.log("reserve0: " + Number(reserves[0])); //mt002
    // console.log("reserve1: " + Number(reserves[1])); //mt001
    // console.log("blockTimestampLast: " + Number(reserves[2]));

    var token0 = await uniswapV2Pair.token0();
    var reserveMT001 = MT001.address == token0 ? reserves[0] : reserves[1];
    var reserveWETH = MT001.address == token0 ? reserves[1] : reserves[0];
    console.log("reserveMT001: " + reserveMT001/1e18);
    console.log("reserveWETH: " + reserveWETH/1e18);

    // 两种方式获得预计输出值
    var amounts = await uniswapV2Router02.getAmountsOut(swapMT001Amount, [MT001.address, wETH.address]);
    console.log("输入mt001值：" + amounts[0]/1e18);
    console.log("预计获得ETH数量为：" + amounts[1]/1e18);
    var amountOut = await uniswapV2Router02.getAmountOut(swapMT001Amount, reserveMT001, reserveWETH);
    console.log("预计获得ETH数量为：" + amountOut/1e18);

    // 设置1%的滑点
    var amountOutMin = amountOut * 0.99;
    console.log("设置1%的滑点，最少获得ETH: " + amountOutMin/1e18);

    console.log("交易前余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(balance/1e18);

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapExactTokensForETH(swapMT001Amount, web3.utils.toWei(amountOutMin+"","wei"), [MT001.address, wETH.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    // var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // // console.log(eventSwap);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
    //   console.log(data);         
    // }
    // var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // // console.log(eventSync);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
    //   console.log(data);         
    // }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    balance = await web3.eth.getBalance(accounts[0]);
    console.log(balance/1e18);
    var reserves = await uniswapV2Pair.getReserves();
    console.log("reserve0: " + reserves[0]/1e18); 
    console.log("reserve1: " + reserves[1]/1e18); 
  });

  it('3.swapExactTokensForTokens: MT001->NEW->MT002', async () => {
    //确定输入的MT001数量，获得指定兑换MT002为输出， 滑点设置为最少输出量
    const swapMT001Amount = web3.utils.toWei("100", 'ether');

    var amounts = await uniswapV2Router02.getAmountsOut(swapMT001Amount, [MT001.address, wETH.address, MT002.address]);
    console.log("输入mt001值：" + amounts[0]/1e18);
    console.log("中间变量eth数量为：" + amounts[1]/1e18);
    console.log("预计获得mt002数量为：" + amounts[2]/1e18);

    // 设置1%的滑点
    var amountOutMin = amounts[2] * 0.99;
    console.log("设置1%的滑点，最少获得mt002: " +amountOutMin/1e18);

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    balance = await MT002.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    
    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));

    var tx = await uniswapV2Router02.swapExactTokensForTokens(swapMT001Amount, web3.utils.toWei(amountOutMin+"","wei"), [MT001.address, wETH.address, MT002.address], accounts[0], deadline, {gas: 6000000});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    // var eventSwap= '0x' + abi.soliditySHA3(['string'], ["Swap(address,uint256,uint256,uint256,uint256,address)"]).toString("hex");
    // // console.log(eventSwap);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSwap));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["uint256","uint256", "uint256","uint256"],log.data);
    //   console.log(data);         
    // }
    // var eventSync= '0x' + abi.soliditySHA3(['string'], ["Sync(uint112,uint112)"]).toString("hex");
    // // console.log(eventSync);
    // var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventSync));
    // // console.log(log);
    // if(log){
    //   var data = web3.eth.abi.decodeParameters(["uint112","uint112"],log.data);
    //   console.log(data);         
    // }

    console.log("交易后余额");
    var balance = await MT001.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
    balance = await MT002.balanceOf.call(accounts[0]);
    console.log(balance/1e18);
  });





// TODO 
  //swapExactTokensForTokensSupportingFeeOnTransferTokens
  //swapExactETHForTokensSupportingFeeOnTransferTokens
  //swapExactTokensForETHSupportingFeeOnTransferTokens

  // TODO 把uniswap都改写成truffle版本
  // 最后检查下文档中的函数全都调用到了https://uniswap.org/docs/v2/smart-contracts/factory/


});















