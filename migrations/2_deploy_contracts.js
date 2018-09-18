var Babcoin = artifacts.require("./Babcoin.sol");
var BabcoinTokenSale = artifacts.require("./BabcoinTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(Babcoin, 1000000).then(function() {
    var babcoinPrice = 1000000000000000000;
    return deployer.deploy(BabcoinTokenSale, Babcoin.address, babcoinPrice);
  });
};
