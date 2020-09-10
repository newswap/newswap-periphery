pragma solidity =0.6.6;

contract NewPriceOracle {
    address public owner;
    mapping(address => bool) public sources;
    mapping(address => Datum) public data;

    struct Datum {
        // unit sec
        uint64 timestamp;
        // a USD price with 6 decimals precision
        uint64 value;
    }

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner");
        _;
    }

    event AddedSource(address _source);

    function addSource(address _source) public onlyOwner {
        require(sources[_source] == false, "Source already added");

        sources[_source] = true;
        emit AddedSource(_source);
    }

    event RemovedSource(address _source);

    function removeSource(address _source) public onlyOwner {
        require(sources[_source], "Remove a nonexistent source");

        sources[_source] = false;
        emit RemovedSource(_source);
    }

    event Put(address _source, uint64 timestamp, uint64 value);

    function put(uint64 _timestamp, uint64 _value) public {
        require(sources[msg.sender], "Only source");
        require(_timestamp > data[msg.sender].timestamp, "Only update if newer than stored");

        data[msg.sender] = Datum(_timestamp, _value);
        emit Put(msg.sender, _timestamp, _value);
    }

    function getPrice(address _source) public view returns(uint64) {
        return data[_source].value; 
    }
}