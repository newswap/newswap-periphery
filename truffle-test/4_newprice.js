const truffleAssert = require('truffle-assertions');
const NewPriceInUSD = artifacts.require("NewPriceInUSD");

contract('NewPriceInUSD', (accounts) => {
  // beforeEach(async () => {
  // });

  it('NewPriceInUSD', async () => {
    // var newPriceInUSD = await NewPriceInUSD.at("");
    var newPriceInUSD = await NewPriceInUSD.deployed();
    console.log("newPriceInUSD: " + newPriceInUSD.address);

    // only owner
    truffleAssert.reverts(newPriceInUSD.addSource(accounts[0], {from: accounts[1]}));

    await newPriceInUSD.addSource(accounts[0], {from: accounts[0]});
    var isSource = await newPriceInUSD.sources(accounts[0]);
    assert.equal(isSource, true);

    // only source
    truffleAssert.reverts(newPriceInUSD.put(1599202369, 789, {from: accounts[1]}));

    await newPriceInUSD.put(1599202369, 789, {from: accounts[0]});
    var data = await newPriceInUSD.data(accounts[0]);
    assert.equal(Number(data[0]), 1599202369);
    assert.equal(Number(data[1]), 789);

    // timestamp < data[msg.sender].timestamp
    truffleAssert.reverts(newPriceInUSD.put(1599202000, 987, {from: accounts[0]}));
    
    await newPriceInUSD.put(1599202600, 987, {from: accounts[0]});
    var data = await newPriceInUSD.data(accounts[0]);
    assert.equal(Number(data[0]), 1599202600);
    assert.equal(Number(data[1]), 987);

    var price = await newPriceInUSD.getPrice(accounts[0]);
    assert.equal(Number(price), 987);
    console.log(Number(price));

    // var number = await web3.eth.getBlockNumber();
    // // console.log(number);
    // var block = await web3.eth.getBlock(number);
    // // console.log(block.timestamp); 
  });

});








