pragma solidity ^0.4.24;

contract Babcoin {
    string public name = "Babcoin";
    string public symbol = "BABS";
    string public standard = "Babcoin version 1.0";
    uint  public  totalSupply;
    event Transfer (
        address indexed _from,
        address indexed _to,
        uint _value
    );
    event Approval (
        address indexed _owner,
        address indexed _spender,    
        uint _value
    );
    mapping (address => uint) public balanceOf; 
    mapping (address => mapping(address => uint)) public allowance; //account A is approving another account   
    constructor(uint _initialSupply) public {
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply; 
    }

    //Transfer tokens
    function transfer(address _to, uint _value) public returns (bool success) {
        require (balanceOf[msg.sender] >= _value);
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }  

    //delegated transfer
    //transfer where accout did not initially initiate the transfer

    //allow spender to withdraw from your account
    function approve (address _spender, uint _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value; 
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    //transfer on behalf of 3rd party
    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        //msg.sender = spender    //_from has given money
        require (_value <= balanceOf[_from]); //we're not taking out more money than_from has
        require (_value <= allowance[_from][msg.sender]); //we're not taking out more money than allowed 
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value; 
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true; 
    }
}