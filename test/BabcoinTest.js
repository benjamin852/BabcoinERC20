var Babcoin = artifacts.require('./Babcoin.sol');

contract('Babcoin', function (accounts) {
    var babcoinInstance;
    it('initializes the contract with the correct values', function () {
        return Babcoin.deployed().then(function (instance) {
            babcoinInstance = instance;
            return babcoinInstance.name();
        }).then(function (name) {
            assert.equal(name, 'Babcoin', 'has the correct name');
            return babcoinInstance.symbol();
        }).then(function (symbol) {
            assert.equal(symbol, 'BABS', 'has the correct symbol');
            return babcoinInstance.standard();
        }).then(function (standard) {
            assert.equal(standard, 'Babcoin version 1.0', 'has the correct standard');
        })
    });
    it('sets the initial supply upon deployment', function () {
        return Babcoin.deployed().then(function (instance) {
            babcoinInstance = instance;
            return babcoinInstance.totalSupply();
        }).then(function (totalSupply) {
            assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1000000');
            return babcoinInstance.balanceOf(accounts[0]);
        }).then(function (adminBalance) {
            assert.equal(adminBalance.toNumber(), 1000000, 'allocates initial supply to admin balance');
        })
    });

    it('transfers token ownership', function () {
        return Babcoin.deployed().then(function (instance) {
            babcoinInstance = instance;
            return babcoinInstance.transfer.call(accounts[1], 999999999999999999999)
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'error messgae must contain revert');
            return babcoinInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
        }).then(function (success) {
            assert.equal(success, true, 'it returns true');
            return babcoinInstance.transfer(accounts[1], 250000, { from: accounts[0] });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Transfer', 'should be the transfer event');
            assert.equal(receipt.logs[0].args._from, accounts[0], 'logs account tokens transferred from');
            assert.equal(receipt.logs[0].args._to, accounts[1], 'logs account tokens transferred to');
            assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
            return babcoinInstance.balanceOf(accounts[1]);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
            return babcoinInstance.balanceOf(accounts[0]);
        }).then(function (balance) {
            assert.equal(balance.toNumber(), 750000, 'deducts amount from sending account');
        });
    });

    it('approves tokens for delegated transfer', function () {
        return Babcoin.deployed().then(function (instance) {
            babcoinInstance = instance;
            return babcoinInstance.approve.call(accounts[1], 100);
        }).then(function (success) {
            assert.equal(success, true, 'the function returned true');
            return babcoinInstance.approve(accounts[1], 100, { from: accounts[0] });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Approval', 'should be the approval event');
            assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs account tokens transferred from');
            assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs account tokens transferred to');
            assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
            return babcoinInstance.allowance(accounts[0], accounts[1]);
        }).then(function (allowance) {
            assert.equal(allowance.toNumber(), 100, 'stores allowance for delegate transfer');
        });
    });

    it('handles delegated transfer', function () {
        return Babcoin.deployed().then(function (instance) {
            babcoinInstance = instance;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            spendingAccount = accounts[4];
            //transfer some  token to fromAccount
            return babcoinInstance.transfer(fromAccount, 100, { from: accounts[0] });
        }).then(function (receipt) {
            //Approve spendingAccount to spend 10 tokens from fromAccount
            return babcoinInstance.approve(spendingAccount, 10, { from: fromAccount });
        }).then(function (receipt) {
            //try send something larger than sender's allowed balance
            return babcoinInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
            //try send something larger than approved amount
            return babcoinInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });//(we approved 10)
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
            return babcoinInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
        }).then(function (success) {
            assert.equal(success, true);
            return babcoinInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
        }).then(function(receipt) {
             assert.equal(receipt.logs.length, 1, 'triggers one event');
             assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "transfer" event');
             assert.equal(receipt.logs[0].args._from, fromAccount, 'account tokens are transfered from');
             assert.equal(receipt.logs[0].args._to, toAccount, 'account tokens are transfered to');
             assert.equal(receipt.logs[0].args._value, 10, 'transfer amount');
             return babcoinInstance.balanceOf(fromAccount); 
        }).then(function(balance) { 
            assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending^ account');
            return babcoinInstance.balanceOf(toAccount); 
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 10, 'deducts the amount from the sending account');
            return babcoinInstance.allowance(fromAccount, spendingAccount);
        }).then(function (allowance) {
            assert.equal(allowance, 0, 'deducts the amount from the allowance');
        });
    });
});