pragma solidity ^0.4.24;
import "./Babcoin.sol";
contract BabcoinTokenSale {
    address admin;
    Babcoin public babcoinContract;
    uint public babcoinPrice;
    uint public babcoinsSold;
    event Sell(address _buyer, uint _amount);
    constructor(Babcoin _babcoinContract, uint _babcoinPrice) public {
        admin = msg.sender;       
        babcoinContract = _babcoinContract;
        babcoinPrice = _babcoinPrice;
    } 
    function multiply(uint _x, uint _y) internal pure returns (uint _z) {
        require(_y == 0 || (_z = _x * _y) / _y == _x);
    }
    function buyTokens(uint _numberOfBabcoins) public payable {
        require(msg.value == multiply(_numberOfBabcoins , babcoinPrice)); 
        require(babcoinContract.balanceOf(this) >= _numberOfBabcoins); 
        require(babcoinContract.transfer(msg.sender, _numberOfBabcoins));//sending babcoins to the sender with specified amount of babcoins 
        babcoinsSold += _numberOfBabcoins;
        emit Sell(msg.sender, _numberOfBabcoins);
    }
    function endSale() public  {
        require(msg.sender == admin);
        require(babcoinContract.transfer(admin, babcoinContract.balanceOf(this))); //transfer remaining tokens back to admin
        selfdestruct(admin);
    }
}