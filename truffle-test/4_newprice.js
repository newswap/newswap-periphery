const truffleAssert = require('truffle-assertions');
const NewPriceOracle = artifacts.require("NewPriceOracle");

contract('NewPriceOracle', (accounts) => {
  // beforeEach(async () => {
  // });

  it('NewPriceOracle', async () => {
    var newPriceOracle = await NewPriceOracle.at("0x32f7bE067b0B557e1f5b6BD6D4D2B6d99E34f2A2");
    // var newPriceOracle = await NewPriceOracle.deployed();
    console.log("newPriceOracle: " + newPriceOracle.address);

    // var number = await web3.eth.getBlockNumber();
    // // // console.log(number);
    // var block = await web3.eth.getBlock(number);
    // console.log(block.timestamp); 

    // // only owner
    // truffleAssert.reverts(newPriceOracle.addSource(accounts[0], {from: accounts[1]}));

    // await newPriceOracle.addSource(accounts[0], {from: accounts[0]});
    // var isSource = await newPriceOracle.sources(accounts[0]);
    // assert.equal(isSource, true);

    // // only source
    // truffleAssert.reverts(newPriceOracle.put(block.timestamp, 789, {from: accounts[1]}));

    // await newPriceOracle.put(block.timestamp, 789, {from: accounts[0]});
    // var data = await newPriceOracle.data(accounts[0]);
    // assert.equal(Number(data[0]), block.timestamp);
    // assert.equal(Number(data[1]), 789);

    // // timestamp < data[msg.sender].timestamp
    // truffleAssert.reverts(newPriceOracle.put(block.timestamp-10, 987, {from: accounts[0]}));
    
    // await newPriceOracle.put(block.timestamp+10, 777, {from: accounts[0]});
    // var data = await newPriceOracle.data(accounts[0]);
    // assert.equal(Number(data[0]), block.timestamp+10);
    // assert.equal(Number(data[1]), 777);

    console.log(accounts[0])
    var price = await newPriceOracle.getPrice(accounts[0]);
    // assert.equal(Number(price), 777);
    console.log(Number(price));


  });

});








