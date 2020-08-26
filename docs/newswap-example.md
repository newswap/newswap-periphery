# Newswap合约调用示例

Newswap是基于NewChain的去中心化代币交换协议，旨在促进NEW和NRC6代币数字资产之间的**自动**兑换交易。  
Newswap移植至[Uniswap](https://uniswap.org/)，为保证合约安全性，完全复用Uniswap的合约代码，所以合约中出现的ETH在Newswap中代表NEW。

**Newswap合约：**

1. UniswapV2Factory

   工厂合约主要用于创建交易对合约，Newswap交易对通过监听`PairCreated`事件。

2. UniswapV2Pair

   交易对合约，每个交易对合约有2种资产，由“流动性提供者”(LP)通过添加流动性提供，NEW对应的合约地址为WNEW，添加流动性、兑换都通过交易对合约完成。

3. UniswapV2Router02

   Newswap对外提供的路由合约，DApp通过该合约能够快速安全的完成添加流动性(若无交易对会自动创建)、兑换、查询等功能。

- WNEW

  Newswap用于接收New的类NRC6合约，用户兑换或添加流动性关联NEW时，使用WNEW合约地址。

**合约文档、地址、abi(&bin)如下：**

- UniswapV2Factory
  - 接口文档：https://uniswap.org/docs/v2/smart-contracts/factory/
  - devnet地址：0x999A9b54Dc8Ac3b9E7012800DF645068fC6ae288
  - [abi&bin](https://gitlab.newtonproject.org/hep/newswap-periphery/-/blob/develop/generate/UniswapV2FactoryABI.json)
- UniswapV2Pair
  - 接口文档：https://uniswap.org/docs/v2/smart-contracts/pair/
  - [abi&bin](https://gitlab.newtonproject.org/hep/newswap-periphery/-/blob/develop/generate/UniswapV2PairABI.json)
- UniswapV2Router02
  - 接口文档：https://uniswap.org/docs/v2/smart-contracts/router02/
  - devnet地址：0x9AC00f1202Cc2c7fC9FCe7f8e19000083E1b97F8
  - [abi&bin](https://gitlab.newtonproject.org/hep/newswap-periphery/-/blob/develop/generate/UniswapV2Router02ABI.json)
- WNEW
  - devnet地址：0x202B1174Cb34ee1b3c36747901F16E8A29031684
  - 文档和bin可使用NRC6合约

## 添加流动性

Newton2.0当前产品设计只支持添加NEW和NRC6交易对的流动性，可通过`UniswapV2Router02.addLiquidityETH`函数添加NEW和NRC6交易对的流动性。用户为交易对添加流动性后，将获得该交易对的流动性代币，流动性代币数量由提供的流动性占交易对中资金比例决定。

### 交易对首次添加流动性

若交易对首次添加流动性，则添加者可自由设置NEW和NRC6的比例(即价格)，添加流动性前需调用NRC6的授权函数，允许UniswapV2Router02合约使用添加者的NRC6代币，流程如下：

1. 授权

   ```
   NRC6.approve(uniswapV2Router02.address, tokenAmount)
   ```

2. 添加流动性

   ```
   //若无交易对合约会自动创建
   UniswapV2Router02.addLiquidityETH(NRC6.address, tokenAmount, 0, 0, accountAddress, deadline, {value: newAmount});
   ```

   tokenAmount和newAmount为交易对添加的NRC6和NEW数量， deadline为交易最晚执行的block.timestamp(链当前时间戳加5分钟应该就够了，如block.timestamp+5*60)。`{value: newAmount}`为调用函数发送的NEW，前面都是函数的正常参数

### 交易对已有流动性

若交易对已存在流动性，需按交易对中资产的比例添加流动性，所以先查询交易对当前资产比例。

1. 获得交易对中资产比例

2. 按资产比例计算出若添加指定输入的NEW或NRC6，另一种资产需添加的数量，然后同上走授权和添加流动性操作即可。

   示例：

   ```
   //获得交易对地址
   const pairAddress = await uniswapV2Factory.getPair(NRC6.address, WNEW.address);
   //交易对合约
   const uniswapV2Pair = await IUniswapV2Pair.at(pairAddress);
   //查询当前资产数量
   const reserves = await uniswapV2Pair.getReserves();
   const token0 = await uniswapV2Pair.token0();
   const tokenReserve = (NRC6.address == token0) ? reserves[0] : reserves[1];
   const wNEWReserve = (NRC6.address == token0) ? reserves[1] : reserves[0];
   
   //确定输入new数量，通过uniswapV2Router02查询需要的token数量
   const newAmount = web3.utils.toWei("5", 'ether');
   const tokenAmount = await uniswapV2Router02.quote(newAmount, wNEWReserve, tokenReserve);
   ```
   
   tokenAmount也可不通过uniswapV2Router02.quote获取，可以自己计算，计算公式为
   
   ```
   amountB = amountA.mul(reserveB) / reserveA;
   ```

### 流动性代币分配算法

用户为交易对添加NRC6和NEW后，将获得该交易对的流动性代币，流动性代币也是一种NRC6(UniswapV2Pair继承了NRC6)，精度为18，分配流动性代币数量分2种情况：

1. 交易对首次被添加流动性(uniswapV2Pair.totalSupply=0)，添加NRC6和NEW的用户获得的流动性代币数量为

   ```
   liquidity = Math.sqrt(nrc6Amount.mul(newAmount)).sub(1000);
   ```

   nrc6Amount和newAmount为准备添加的NRC6和NEW数量(单位为wei，如1NEW为10**18)，首次添加流动性将1000分配给address(0)，保证交易对添加流动性后不会再为空(因为流动性代币精度是18，1个流动性代币对应的数值为10的18次方，所以1000数量极小)。

   因首次添加，添加成功后用户当前占交易对流动性比例约等于100%。

2. 当前交易对已有流动性，添加NRC6和NEW的用户获得的流动性代币数量为

   ```
   //获得交易对地址
   const pairAddress = await uniswapV2Factory.getPair(NRC6.address, WNEW.address);
   //交易对合约
   const uniswapV2Pair = await IUniswapV2Pair.at(pairAddress);
   //交易对当前流动性代币总数
   const totalSupply = await uniswapV2Pair.totalSupply()
   
   //Math.min为取两者最小值
   liquidity = Math.min(nrc6Amount.mul(totalSupply) / nrc6Reserve, newAmount.mul(totalSupply) / newReserve);
   ```

   nrc6Amount和newAmount为准备添加的NRC6和NEW数量(单位为wei，如1NEW为10**18)，nrc6Reserve和newReserve为交易对中NRC6和NEW数量。

   用户添加成功后，当前添加的资产对应流动性代币占比为 liquidity/(liquidity+totalSupply)。

   

查询用户指定交易对的流动性代币数量

```
const liquidity = await uniswapV2Pair.balanceOf(accountAddress)
```
`用户持有交易对流动性代币数量/交易对总的流动性代币数量`代表用户持有该交易对中资产(NRC6和NEW)的比例，例如这个比例为10%，则代表交易对中10%的NRC6和NEW归属该用户，用户若将持有的流动性代币全部移除，将拿到交易对中10%的NEW和10%的NRC6（当然也可自由设置需要移除的流动性代币数量）


## 移除流动性

用户为交易对添加流动性后，将获得该交易对的流动性代币，移除流动性即根据需要销毁的流动性代币数量占比返还交易对中资产，通过`UniswapV2Router02.removeLiquidityETH`函数移除NEW-NRC6交易对的流动性。

1. 查询用户持有流动性代币数

   ```
   //获得交易对合约地址
   var uniswapV2Pair = await IUniswapV2Pair.at(pairAddress);
   var liquidity = await uniswapV2Pair.balanceOf(accountAddress); 
   ```

2. 授权

   UniswapV2Router02合约代用户处理流动性代币，所以需进行授权操作

   ```
   uniswapV2Pair.approve(uniswapV2Router02.address, liquidity);
   ```

3. 移除流动性

   ```
   //此处全部移除，可设置liquidity数量决定移除比例
   uniswapV2Router02.removeLiquidityETH(NRC6.address, liquidity, 0, 0, accountAddress, deadline);
   ```

## 兑换

Newton2.0支持NEW兑换NRC6、NRC6兑换NEW、NRC6兑换NRC6 三种情况，分别调用uniswapV2Router02的`swapExactETHForTokens`、`swapExactTokensForETH`、`swapExactTokensForTokens`。每个交易对合约进行兑换操作时，都会收取0.3%的手续费，输入金额扣除0.3%后，按照`恒定乘积做市商算法`可计算出兑换量。因当前流动池只有NEW和NRC6的交易对，所以手续费可统一表述为NRC6和NEW兑换为0.3%，NRC6和NRC6兑换为0.599%(NRC6-1兑换成NRC6-2，需先NRC6-1兑换成NEW，然后NEW兑换NRC6-2)。

### NEW兑换NRC6

1. 计算New可兑换NRC6的数量

   ```
   // amount[1]为预计可获得的NRC6的数量，调用前需确保有WNEW-NRC6交易对存在并有流动性
   var amounts = await uniswapV2Router02.getAmountsOut(newAmount, [WNEW.address, NRC6.address]);
   ```

2. 根据滑点设置最小输出NRC6数量

   ```
   //如设置1%的滑点
   var amountOutMin = amounts[1] * 0.99;
   ```

3. 兑换

   ```
   // [WNEW.address, NRC6.address]路径顺序不能写反了,并且路径上有流动性
   uniswapV2Router02.swapExactETHForTokens(amountOutMin, [WNEW.address, NRC6.address], accountAddress, deadline, {value: newAmount});
   ```

### NRC6兑换NEW

1. 同上一样先计算NRC6可兑换的NEW数量，以及根据滑点设置最小输出NEW数量

   ```
   var amounts = await uniswapV2Router02.getAmountsOut(tokenAmount, [NRC6.address, WNEW.address]);
   //如设置1%的滑点
   var amountOutMin = amounts[1] * 0.99;
   ```

2. 授权

   因UniswapV2Router02合约需使用用户的NRC6代币，所以需进行授权操作

   ```
   NRC6.approve(uniswapV2Router02.address,tokenAmount);
   ```

3. 兑换

   ```
   // [NRC6.address, WNEW.address]路径顺序不能写反了,并且路径上有流动性
   uniswapV2Router02.swapExactTokensForETH(tokenAmount, amountOutMin, [NRC6.address, WNEW.address], accountAddress, deadline);
   ```

### NRC6兑换NRC6

NRC6代币之间的兑换需要调用两个交易对合约，NRC6-1/NEW交易对和NRC6-2/NEW交易对。

1. 同上一样先计算NRC6-1可兑换的NRC6-2数量，以及根据滑点设置最小输出NRC6-2数量

   ```
   var amounts = await uniswapV2Router02.getAmountsOut(token1Amount, [NRC6-1.address, WNEW.address,NRC6-2.address]);
   //如设置1%的滑点，因为此处使用2个交易对合约，amounts返回3个值，所以最终输出量使用amount[2]
   var amountOutMin = amounts[2] * 0.99;
   ```

2. 授权

   因UniswapV2Router02合约需使用用户的NRC6-1代币，所以需进行授权操作

   ```
   NRC6-1.approve(uniswapV2Router02.address,token1Amount);
   ```

3. 兑换

   ```
   // [NRC6-1.address, WNEW.address, NRC6-2.address]路径顺序不能写反了,并且路径上有流动性
   await uniswapV2Router02.swapExactTokensForTokens(token1Amount, amountOutMin, [NRC6-1.address, WNEW.address, NRC6-2.address], accountAddress, deadline);
   ```

## 恒定乘积做市商算法

Uniswap围绕的是 `x * y = k`这一“恒定乘积做市商”公式。交易的价格随着交易金额的比例成二次函数变化。在Uniswap上执行任何交易，此恒定乘积值都保持不变。只有当此交易合约中的流动性池发生变化的时候，此恒定乘积值才会发生变化。我们用 ETH/BAT（一种ERC20代币）来举例：

Bob想要发起交易来用自己的1个ETH兑换成ERC20代币BAT，Bob将使用 Uniswap上已经存在的BAT交易合约来实现此兑换操作。此时，流动性提供者已经将一定量的ETH和BAT存在了交易合约中。我们这里举例，流动性提供者一共存了10ETH和500BAT。因此，基础的恒定乘积值为：

ETH 池 * BAT 池 = 恒定乘积值

ETH 池 = 10

BAT 池 = 500

恒定乘积值 = 500 * 10 = 5000

Bob将通过向交易合约的ETH池发送1ETH来启动这笔交易，此时，交易金额的0.3%也就是0.003ETH将被扣除作为给流动性提供者的报酬。剩余的0.997ETH则被添加到了ETH池里面。然后，恒定乘积值除ETH池中新的ETH数量，来得到BAT池中应该有的数量。那么多出来的BAT，就可以分给Bob了。具体如下：

Bob发送了 1 ETH

费用 = 0.003 ETH

ETH 池 = 10 + (1 – 0.003) = 10.997

BAT 池 = 5000/10.997 = 454.67

Bob 将兑换得到 : 500 – 454.67 = 45.33 BAT

这个在Bob开始交易时收取的流动性提供者费用，现在又重新添加到ETH流动池里面。这是对流动性提供者的一种报酬，当这些流动性提供者从流动池中取回自己的ETH和ERC20代币时，可以获得这些报酬。由于这些流动性提供者的报酬是在上述兑换交易计算后才添加回ETH流动池里面，**因此在交易合约上每执行一次交易，恒定乘积值就会增加一点，这就让流动性提供者为交易合约提供流动性这件事成为一种有利可图的行为。**这笔交易完成后，

ETH 池 = 10.997 + 0.003 = 11

BAT 池 = 454.67

新的恒定乘积值 = 5,001.37

在这次交易中，Bob兑换的汇率为 45.33 BAT/ETH






