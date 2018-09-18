
// var TruffleContract = require('truffle-contract');
App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    babcoinPrice: 1000000000000000000,
    babcoinsSold: 0,
    babcoinsAvailable: 750000,
    init: function () {
        console.log("App initialize");
        return App.initWeb3();
    },
    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContracts();
    },

    initContracts: function () {
        $.getJSON("BabcoinTokenSale.json", function (babcoinTokenSale) {
            App.contracts.BabcoinTokenSale = TruffleContract(babcoinTokenSale);
            App.contracts.BabcoinTokenSale.setProvider(App.web3Provider)
            App.contracts.BabcoinTokenSale.deployed().then(function (babcoinTokenSale) {
                console.log("Babcoin sale address: ", babcoinTokenSale.address);
            });
        }).done(function () {
            $.getJSON("Babcoin.json", function (babcoin) {
                App.contracts.Babcoin = TruffleContract(babcoin);
                App.contracts.Babcoin.setProvider(App.web3Provider);
                App.contracts.Babcoin.deployed().then(function (babcoin) {
                    console.log("Babcoin address:", babcoin.address);
                });
                App.listenForEvents();
                return App.render();
            });
        })
    },

    listenForEvents: function () {
        App.contracts.BabcoinTokenSale.deployed().then(function (instance) {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest',
            }).watch(function (error, event) {
                console.log("event triggered", event);
                App.render();
            })
        })
    },

    render: function () {
        if (App.loading) {
            return true;
        }
        App.loading = true;
        var loader = $('#loader');
        var content = $('#content');
        loader.show();
        content.hide();
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $('#accountAddress').html("Your Account:" + account);
            }
        })

        // Load token sale contract
        App.contracts.BabcoinTokenSale.deployed().then(function (instance) {
            babcoinTokenSaleInstance = instance;
            return babcoinTokenSaleInstance.babcoinPrice();
        }).then(function (babcoinPrice) {
            console.log('babcoin price: ', babcoinPrice.toNumber());
            App.babcoinPrice = babcoinPrice;
            $('.babcoin-price').html(web3.fromWei(App.babcoinPrice, "ether").toNumber());
            return babcoinTokenSaleInstance.babcoinsSold();
        }).then(function (babcoinsSold) {
            App.babcoinsSold = babcoinsSold.toNumber();
            $('.babcoins-sold').html(App.babcoinsSold);
            $('.babcoins-available').html(App.babcoinsAvailable) * 100;

            var progressPercent = (Math.ceil(App.babcoinsSold) / App.babcoinsAvailble) * 100;
            $('#progress').css('width', progressPercent + '%');

            //Load token contract 
            App.contracts.Babcoin.deployed().then(function (instance) {
                babcoinInstance = instance;
                return babcoinInstance.balanceOf(App.account);
            }).then(function (balance) {
                $('.babcoin-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            })
        });
    },

    buyBabcoins: function () {
        $('#content').hide();
        $('#loader').show();
        var numberOfBabcoins = $('#numberOfBabcoins').val();
        App.contracts.BabcoinTokenSale.deployed().then(function (instance) {
            return instance.buyTokens(numberOfBabcoins, {
                from: App.account,
                value: numberOfBabcoins * App.babcoinPrice,
                gas: 500000
            });
        }).then(function (result) {
            console.log("Babcoins bought...")
            $('form').trigger('reset')  //reset number of babcoins in form 
            $('#loader').hide();
            $('#content').show();
        })
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    })
});
