const truffleAssert = require('truffle-assertions');
const abi = require('ethereumjs-abi');

const NRC6 = artifacts.require("NRC6");
const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const WNEW9 = artifacts.require("WNEW9");
const TestRouter = artifacts.require("TestRouter");

const MINIMUM_LIQUIDITY = 1000;

let MT001, MT002;
let uniswapV2Factory, uniswapV2Router02, wETH;
let mt001And002PairAddress, ethAndMT001PairAddress;
let deadline, testRouter;

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

    testRouter = await TestRouter.new();

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

    var pairFor = await testRouter.pairFor(uniswapV2Factory.address, MT001.address, MT002.address);
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
    var pairFor = await testRouter.pairFor(uniswapV2Factory.address, MT001.address, wETH.address);
    assert.equal(pairFor, ethAndMT001PairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    const factory = await uniswapV2Pair.factory();
    assert.equal(factory, uniswapV2Factory.address);

    const reserves = await uniswapV2Pair.getReserves();
    assert.equal(Number(reserves[0]), 0);
    assert.equal(Number(reserves[1]), 0);
  });

    ///////////////////////////////////////////////////
    //          ADD LIQUIDITY                        //
    /////////////////////////////////////////////////// 

  it('addLiquidity for MT001AndMT002Pair，permanently lock the first MINIMUM_LIQUIDITY tokens', async () => {
    // 首次添加流动性，可自由定义汇率
    const token1Amount = web3.utils.toWei("1", 'ether');
    const token2Amount = web3.utils.toWei("4", 'ether');
    const expectedLiquidity = web3.utils.toWei("2", 'ether');

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    await MT002.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    
    //没有交易对此处会自动创建
    var tx = await uniswapV2Router02.addLiquidity(MT001.address, MT002.address, token1Amount, token2Amount, 0, 0, accounts[0], deadline, {gas: 1999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    mt001And002PairAddress = await uniswapV2Factory.getPair(MT001.address, MT002.address);
    // console.log(mt001And002PairAddress);
    var balance = await MT001.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 999);
    balance = await MT001.balanceOf.call(mt001And002PairAddress);
    assert.equal(balance/1e18, 1);
    balance = await MT002.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 996);
    balance = await MT002.balanceOf.call(mt001And002PairAddress);
    assert.equal(balance/1e18, 4);

    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    balance = await uniswapV2Pair.balanceOf.call(accounts[0]); // 第一次初始化有MINIMUM_LIQUIDITY 1000 给address0
    assert.equal(Number(balance), Number(expectedLiquidity) - MINIMUM_LIQUIDITY);

    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? Number(token1Amount) : Number(token2Amount));
    assert.equal(Number(reserves[1]), MT001.address == token0 ? Number(token2Amount) : Number(token1Amount));
  });

  it('addLiquidity for MT001AndMT002Pair again', async () => {
    // 第二次添加流动性
    mt001And002PairAddress = await uniswapV2Factory.getPair(MT001.address, MT002.address);
    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);

    const token1Amount = web3.utils.toWei("1", 'ether');
    const token2Amount = web3.utils.toWei("4", 'ether');
    const addedLiquidity = web3.utils.toWei("2", 'ether');

    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    const token1Reserve = (MT001.address == token0) ? reserves[0] : reserves[1];
    const token2Reserve = (MT001.address == token0) ? reserves[1] : reserves[0];

    var amountB = await uniswapV2Router02.quote(token1Amount, token1Reserve, token2Reserve);
    assert.equal(Number(amountB), token2Amount);

    var preLiquidity = await uniswapV2Pair.balanceOf.call(accounts[0]);

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    await MT002.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    // 超额添加token2，但只会收token2Amount
    var tx = await uniswapV2Router02.addLiquidity(MT001.address, MT002.address, token1Amount, web3.utils.toWei("100", 'ether'), 0, 0, accounts[0], deadline, {gas: 1999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var balance = await MT001.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 998);
    balance = await MT001.balanceOf.call(mt001And002PairAddress);
    assert.equal(balance/1e18, 2);
    balance = await MT002.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 992);
    balance = await MT002.balanceOf.call(mt001And002PairAddress);
    assert.equal(balance/1e18, 8);

    var liquidity = await uniswapV2Pair.balanceOf.call(accounts[0]);
    assert.equal(Number(liquidity), Number(preLiquidity) + Number(addedLiquidity));

    const reserves2 = await uniswapV2Pair.getReserves();
    assert.equal(Number(reserves2[0]), MT001.address == token0 ? Number(token1Amount)+Number(token1Reserve) : Number(token2Amount)+Number(token2Reserve));
    assert.equal(Number(reserves2[1]), MT001.address == token0 ? Number(token2Amount)+Number(token2Reserve) : Number(token1Amount)+Number(token1Reserve));
  });

  it('addLiquidity for ETHAndMT001Pair，permanently lock the first MINIMUM_LIQUIDITY tokens', async () => {
    // 首次添加new和mt001流动性
    const token1Amount = web3.utils.toWei("1", 'ether');
    const ethAmount = web3.utils.toWei("4", 'ether');
    const expectedLiquidity = web3.utils.toWei("2", 'ether');
    const preETH = await web3.eth.getBalance(wETH.address);

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    
    // 交易对此处会自动创建
    var tx = await uniswapV2Router02.addLiquidityETH(MT001.address, token1Amount, 0, 0, accounts[0], deadline, {value: ethAmount, gas: 1999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    var balance = await MT001.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 997);
    balance = await MT001.balanceOf.call(ethAndMT001PairAddress);
    assert.equal(balance/1e18, 1);
    balance = await wETH.balanceOf.call(ethAndMT001PairAddress);
    assert.equal(balance/1e18, 4);
    balance = await web3.eth.getBalance(wETH.address);
    assert.equal(balance, Number(preETH)+Number(ethAmount));

    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    balance = await uniswapV2Pair.balanceOf.call(accounts[0]); //第一次初始化有MINIMUM_LIQUIDITY 1000 给address0
    assert.equal(Number(balance), Number(expectedLiquidity) - MINIMUM_LIQUIDITY);

    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? Number(token1Amount) : Number(ethAmount));
    assert.equal(Number(reserves[1]), MT001.address == token0 ? Number(ethAmount) : Number(token1Amount));
  });

  it('addLiquidity for ETHAndMT001Pair again', async () => {
    ethAndMT001PairAddress = await uniswapV2Factory.getPair(MT001.address, wETH.address);
    // 二次添加new和mt001流动性
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);

    const token1Amount = web3.utils.toWei("1", 'ether');
    const ethAmount = web3.utils.toWei("4", 'ether');
    const addedLiquidity = web3.utils.toWei("2", 'ether');
    const preETH = await web3.eth.getBalance(wETH.address);
    var preLiquidity = await uniswapV2Pair.balanceOf.call(accounts[0]);

    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    const token1Reserve = (MT001.address == token0) ? reserves[0] : reserves[1];
    const ethReserve = (MT001.address == token0) ? reserves[1] : reserves[0];
    var amountETH = await uniswapV2Router02.quote(token1Amount, token1Reserve, ethReserve);
    assert.equal(Number(amountETH), ethAmount);

    await MT001.approve(uniswapV2Router02.address, web3.utils.toWei("1000", 'ether'));
    // 超额添加new，但只会收ethAmount
    var tx = await uniswapV2Router02.addLiquidityETH(MT001.address, token1Amount, 0, 0, accounts[0], deadline, {value: Number(ethAmount)+Number(web3.utils.toWei("4", 'ether')), gas: 1999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);
    
    var balance = await MT001.balanceOf.call(accounts[0]);
    assert.equal(balance/1e18, 996);
    balance = await MT001.balanceOf.call(ethAndMT001PairAddress);
    assert.equal(balance/1e18, 2);
    balance = await wETH.balanceOf.call(ethAndMT001PairAddress);
    assert.equal(balance/1e18, 8);
    balance = await web3.eth.getBalance(wETH.address);
    assert.equal(balance, Number(preETH)+Number(ethAmount));

    var liquidity = await uniswapV2Pair.balanceOf.call(accounts[0]);
    assert.equal(Number(liquidity), Number(preLiquidity) + Number(addedLiquidity));

    const reserves2 = await uniswapV2Pair.getReserves();
    assert.equal(Number(reserves2[0]), (MT001.address == token0) ? Number(token1Amount)+Number(token1Reserve) : Number(ethAmount)+Number(ethReserve));
    assert.equal(Number(reserves2[1]), (MT001.address == token0) ? Number(ethAmount)+Number(ethReserve) : Number(token1Amount)+Number(token1Reserve));
  });

    ///////////////////////////////////////////////////
    //         REMOVE LIQUIDITY                       //
    /////////////////////////////////////////////////// 
  it('removeLiquidity for MT001AndMT002Pair', async () => {
    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    var account0Balance001 = await MT001.balanceOf.call(accounts[0]);    
    var account0Balance002 = await MT002.balanceOf.call(accounts[0]); 
    var pairBalance001 = await MT001.balanceOf.call(mt001And002PairAddress);    
    var pairBalance002 = await MT002.balanceOf.call(mt001And002PairAddress); 

    var liquidity = await uniswapV2Pair.balanceOf.call(accounts[0]); 
    await uniswapV2Pair.approve(uniswapV2Router02.address, liquidity); //授权rout使用accouts[0]的流动性代币
    var tx = await uniswapV2Router02.removeLiquidity(MT001.address, MT002.address, liquidity, 0, 0, accounts[0], deadline, {gas: 1999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var balance = await MT001.balanceOf.call(accounts[0]);    // 流动性中有1000给了address(0)，所以会少一点-500
    assert.equal(Number(balance), Number(account0Balance001)+Number(pairBalance001)-500);
    balance = await MT001.balanceOf.call(mt001And002PairAddress); // address(0)
    assert.equal(Number(balance), 500);
    balance = await MT002.balanceOf.call(accounts[0]); // 流动性中有1000给了address(0)，所以会少一点-2000
    assert.equal(Number(balance), Number(account0Balance002)+Number(pairBalance002)-2000);
    balance = await MT002.balanceOf.call(mt001And002PairAddress);
    assert.equal(Number(balance), 2000);

    var liquidity = await uniswapV2Pair.balanceOf.call(accounts[0]); 
    assert.equal(liquidity/1e18, 0);
    var totalSupply = await uniswapV2Pair.totalSupply.call(); 
    assert.equal(Number(totalSupply), MINIMUM_LIQUIDITY);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? 500 : 2000);
    assert.equal(Number(reserves[1]), MT001.address == token0 ? 2000 : 500);
  });

  it('removeLiquidity for ETHAndMT001Pair', async () => {
    var uniswapV2Pair = await IUniswapV2Pair.at(ethAndMT001PairAddress);
    var account0Balance001 = await MT001.balanceOf.call(accounts[0]);   
    var account0BalanceETH = await  web3.eth.getBalance(accounts[0]); 
    var pairBalance001 = await MT001.balanceOf.call(ethAndMT001PairAddress);    
    var pairBalanceETH = await wETH.balanceOf.call(ethAndMT001PairAddress); 

    var liquidity = await uniswapV2Pair.balanceOf.call(accounts[0]); 
    await uniswapV2Pair.approve(uniswapV2Router02.address, liquidity); //授权rout使用accouts[0]的流动性代币
    // 此处和removeLiquidity区别是先把币从pair转给uniswapV2Router02，然后由rout转给用户，removeLiquidity函数传的是address(this)
    var tx = await uniswapV2Router02.removeLiquidityETH(MT001.address, liquidity, 0, 0, accounts[0], deadline, {gas: 1999999});
    // console.log(tx);
    // console.log(tx.logs);  
    // console.log(tx.receipt.rawLogs);

    var balance = await MT001.balanceOf.call(accounts[0]);    // 流动性中有1000给了address(0)，所以会少一点-500
    assert.equal(Number(balance), Number(account0Balance001)+Number(pairBalance001)-500);
    balance = await MT001.balanceOf.call(ethAndMT001PairAddress); // address(0)
    assert.equal(Number(balance), 500);
    balance = await web3.eth.getBalance(accounts[0]);
    assert.equal(parseInt(Number(balance)/1e18), parseInt((Number(account0BalanceETH)+Number(pairBalanceETH)-2000)/1e18))
    balance = await wETH.balanceOf.call(ethAndMT001PairAddress); // 不为0，初始化时给address(0)的那部分币 
    assert.equal(Number(balance), 2000);
    balance = await web3.eth.getBalance(wETH.address);
    assert.equal(Number(balance), 2000);

    var liquidity = await uniswapV2Pair.balanceOf.call(accounts[0]); 
    assert.equal(liquidity/1e18, 0);
    var totalSupply = await uniswapV2Pair.totalSupply.call(); 
    assert.equal(Number(totalSupply), MINIMUM_LIQUIDITY);
    const reserves = await uniswapV2Pair.getReserves();
    const token0 = await uniswapV2Pair.token0();
    assert.equal(Number(reserves[0]), MT001.address == token0 ? 500 : 2000);
    assert.equal(Number(reserves[1]), MT001.address == token0 ? 2000 : 500);
  });

  // it('removeLiquidityWithPermit', async () => {
  // });

  // it('removeLiquidityETHWithPermit', async () => {
  // });

  // v2 版本： supporting fee-on-transfer tokens 
  //removeLiquidityETHSupportingFeeOnTransferTokens
  //removeLiquidityETHWithPermitSupportingFeeOnTransferTokens

  // TODO 把uniswap都改写成truffle版本
});















