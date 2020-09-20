pragma solidity =0.6.6;

import '../libraries/UniswapV2Library.sol';

contract TestRouter {

    function pairFor(address factory, address tokenA, address tokenB) public view returns (address) {
        return UniswapV2Library.pairFor(factory, tokenA, tokenB);
    }

}
