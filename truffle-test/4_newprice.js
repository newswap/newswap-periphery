const truffleAssert = require('truffle-assertions');
const NewPriceInUSD = artifacts.require("NewPriceInUSD");

contract('NewPriceInUSD', (accounts) => {
  // beforeEach(async () => {
  // });

  it('NewPriceInUSD', async () => {
    var newPriceInUSD = await NewPriceInUSD.at("0x32f7bE067b0B557e1f5b6BD6D4D2B6d99E34f2A2");
    // var newPriceInUSD = await NewPriceInUSD.deployed();
    console.log("newPriceInUSD: " + newPriceInUSD.address);

    var number = await web3.eth.getBlockNumber();
    // // console.log(number);
    var block = await web3.eth.getBlock(number);
    console.log(block.timestamp); 

    // only owner
    truffleAssert.reverts(newPriceInUSD.addSource(accounts[0], {from: accounts[1]}));

    // await newPriceInUSD.addSource(accounts[0], {from: accounts[0]});
    // var isSource = await newPriceInUSD.sources(accounts[0]);
    // assert.equal(isSource, true);

    // only source
    truffleAssert.reverts(newPriceInUSD.put(block.timestamp, 789, {from: accounts[1]}));

    await newPriceInUSD.put(block.timestamp, 789, {from: accounts[0]});
    var data = await newPriceInUSD.data(accounts[0]);
    assert.equal(Number(data[0]), block.timestamp);
    assert.equal(Number(data[1]), 789);

    // timestamp < data[msg.sender].timestamp
    truffleAssert.reverts(newPriceInUSD.put(block.timestamp-10, 987, {from: accounts[0]}));
    
    await newPriceInUSD.put(block.timestamp+10, 777, {from: accounts[0]});
    var data = await newPriceInUSD.data(accounts[0]);
    assert.equal(Number(data[0]), block.timestamp+10);
    assert.equal(Number(data[1]), 777);

    console.log(accounts[0])
    var price = await newPriceInUSD.getPrice(accounts[0]);
    assert.equal(Number(price), 777);
    console.log(Number(price));


  });

});








