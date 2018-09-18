var Babcoin = artifacts.require("./Babcoin.sol");
var BabcoinTokenSale = artifacts.require("./BabcoinTokenSale.sol");

contract('BabcoinTokenSale', function (accounts) {
    var babcoin;
    var babcoinSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var babcoinTokenPrice = 1000000000000000000;
    var babcoinsAvailable = 750000;//75% of total supply will to admin
    var numberOfBabcoins;
    it('initializes the contract with the correct values', function () {
        return BabcoinTokenSale.deployed().then(function (instance) {
            babcoinSaleInstance = instance;
            return babcoinSaleInstance.address;
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has contract address');
            return babcoinSaleInstance.babcoinContract();
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'can access babcoin contract address');
            return babcoinSaleInstance.babcoinPrice();
        }).then(function (price) {
            assert.equal(price, babcoinTokenPrice, 'token price is correct');
        });
    });
    it('facilitates token buying', function () {
        return Babcoin.deployed().then(function (instance) {
            babcoin = instance;
            return BabcoinTokenSale.deployed();
        }).then(function (instance) {  
            babcoinSaleInstance = instance;
            //admin transfer 750k to other contract
            return babcoin.transfer (babcoinSaleInstance.address, babcoinsAvailable, {from: admin}); 
        }).then(function(receipt) {
            numberOfBabcoins = 10;
            return babcoinSaleInstance.buyTokens(numberOfBabcoins, { from: buyer, value: numberOfBabcoins * babcoinTokenPrice })
        }).then(function (receipt) { 
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._amount, numberOfBabcoins, 'number of babcoins purchased');
            return babcoinSaleInstance.babcoinsSold();
        }).then(function (amount) {
            assert.equal(amount.toNumber(), numberOfBabcoins, 'number of tokens sold is the same as number we just bought');
            return babcoin.balanceOf(buyer);
        }).then(function(balance) { 
            assert.equal(balance.toNumber(), numberOfBabcoins);
            return babcoin.balanceOf(babcoinSaleInstance.address); //balance of buyer
        }).then(function (balance) {
            assert.equal(balance.toNumber(), babcoinsAvailable - numberOfBabcoins);
            // try buy babcoins at different from ether value 
            return babcoinSaleInstance.buyTokens(numberOfBabcoins, {from: buyer, value: 1});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal # of tokens in wei');
            return babcoinSaleInstance.buyTokens(800000, {from: buyer, value: numberOfBabcoins * babcoinTokenPrice});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more babcoins than available');
        });
    });

    it('ends babcoin sale', function() {
        return Babcoin.deployed().then(function(instance) {
            babcoin = instance;
            return BabcoinTokenSale.deployed();
        }).then(function(instance) {
            babcoinSaleInstance = instance;
            return babcoinSaleInstance.endSale({from: buyer}); 
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert' >= 0, 'must be admin to end the sale')); 
            return babcoinSaleInstance.endSale({from: admin}); //end sale as admin
        }).then(function(receipt) {
            return babcoin.balanceOf(admin);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 999990,  'returns  all unsold dapp tokens to admin');
            return babcoinSaleInstance.babcoinPrice();
        }).then (function (price) {
            assert.equal(price, 0, 'token price was reset');
        })
    });
});