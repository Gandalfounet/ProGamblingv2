$(document).ready(function() {
    var socket = io.connect('https://csgobing.com:443', {secure:true});


    const pwet = $('.numbers-container').html()
    const pwet2 = $('.numbers-arrow-helper').html()
    let bip = new Audio('/static/sound/tone.mp3');
    let roll = new Audio('/static/sound/rolling.wav');    
    const page = $('meta[name=page]').attr("content")
    const volumeUp = '<i class="fas fa-volume-up"></i>'
    const volumeDown = '<i class="fas fa-volume-off"></i>'
    var minStake = 5;
    var maxStake = 300;
    var stakeLimit = 300;
    var stakeSlider;
    var click_once = 0;
    var app = new Vue({
        el: '#app',
        data: {

            priceList: {},
            rates: {
                user: {},
                bot: {}
            },
            disableReload: true,
            disableTrade: true,
            // bot
            floats: {},
            selectedBot: 'All bots',
            botInventories: {},
            botInventory: [],
            botInventorySelected: [],
            botInventorySelectedValue: 0,
            // user
            userInventory: [],
            userInventorySelected: [],
            userInventorySelectedValue: 0,
            // auth
            user: false,
            // site
            site: {
                header: '',
                steamGroup: '#',
                copyrights: '',
                twitter : '',
            },
            config_site: {                
                sitename: '',
                max_item: 0,
                min_deposit: 0,
                fee: 0,
                fee_reduc: 0,
            }, 
            // trade
            offerStatus: {},
            invalidTradelink: false,
            chat : [],
            message : '',      

   
            //Roulette
            preparing: false,
            countdownRoulette: false,
            rolling: false,
            last_translate: 0,
            toAppend: pwet,
            toAppend2: pwet2,
            roulette_amount: 10,
            currentBet : [],
            historyRoulette: [],
            red_bets: 0,
            green_bets: 0,
            black_bets: 0,

            freecode: '',
            sound_enable:true,
            text_volume: volumeUp
        },
        methods: {
            setInventorySort: function(who, value) {
                if(who == 'bot') {
                    this.botInventory = this.sortInventory(this.botInventory, value);
                } else {
                    this.userInventory = this.sortInventory(this.userInventory, value);
                }
            },
            sortInventory: function(inventory, desc) {
                return inventory.sort(function(a, b) {
                    if(desc) {
                        return b.price - a.price;
                    } else {
                        return a.price - b.price;
                    }
                });
            },
            addItem: function(who, id, assetid, price) {
                if(typeof price === 'undefined') {
                    price = assetid;
                    assetid = id;
                }
                if(who == 'bot') {
                    if(this.selectedBot !== id) {
                        this.activeBot(id);
                    }
                    var botInventorySelected = this.botInventorySelected;
                    botInventorySelected.push(assetid);
                    this.botInventorySelected = botInventorySelected;
                    this.botInventorySelectedValue += parseFloat(price);
                } else {
                    var userInventorySelected = this.userInventorySelected;
                    userInventorySelected.push(assetid);
                    this.userInventorySelected = userInventorySelected;
                    this.userInventorySelectedValue += parseFloat(price);
                }
                this.checkTradeable();
            },
            removeItem: function(who, id, assetid, price) {
                if(typeof price === 'undefined') {
                    price = assetid;
                    assetid = id;
                }
                if(who == 'bot') {
                    this.botInventorySelected.splice($.inArray(assetid, this.botInventorySelected),1);
                    this.botInventorySelectedValue -= price;
                } else {
                    this.userInventorySelected.splice($.inArray(assetid, this.userInventorySelected),1);
                    this.userInventorySelectedValue -= price;
                    if(this.userInventorySelectedValue <= 0) {
                        this.userInventorySelectedValue = 0;
                    }
                }
                this.checkTradeable();
            },
            checkTradeable: function() {
                var user = parseFloat(this.userInventorySelectedValue.toFixed(2));
                var bot = parseFloat(this.botInventorySelectedValue.toFixed(2));
                if(user != 0 && user >= bot) {
                    this.disableTrade = false;
                } else {
                    this.disableTrade = true;
                }
            },
            activeBot: function(id) {
                if(this.selectedBot !== id) {
                    if(id == 'All Bots') {
                        var botInventory = [];
                        for(var i in this.botInventories) {
                            var bot = this.botInventories[i];
                            for(var y in bot.items) {
                                var item = bot.items[y];
                                item.bot = i;
                                if(app.priceList[item.data.market_hash_name] <= app.rates.trash) {
                                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.bot['trash']).toFixed(2);
                                } else {
                                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.bot[item.item_type.name]).toFixed(2);
                                }
                                botInventory.push(item);
                            }
                        }
                        this.botInventory = sortInventory(botInventory, true);
                    } else {
                        this.botInventory = this.sortInventory(this.botInventories[id].items, true);
                    }
                    this.botInventorySelected = [];
                    this.botInventorySelectedValue = 0;
                    this.selectedBot = id;
                }
            },
            searchInventory: function(who, value) {
                var inventory = [];
                var search = [];
                if(who == 'bot') {
                    search = this.botInventory;
                } else {
                    search = this.userInventory;
                }
                for(var i in search) {
                    var item = search[i];
                    if(item.data.market_hash_name.toLowerCase().indexOf(value.toLowerCase()) === -1) {
                        item.hidden = 1;
                    } else {
                        item.hidden = 0;
                    }
                    inventory.push(item);
                }
                if(who == 'bot') {
                    this.botInventory = sortInventory(inventory, true);
                } else {
                    this.userInventory = sortInventory(inventory, true);
                }
            },
            updateTradelink: function() {
                var link = this.user.tradelink;
                if(typeof link !== 'undefined') {
                    link = link.trim();
                    if(
                        link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
                        link.indexOf('?partner=') === -1 ||
                        link.indexOf('&token=') === -1
                    ) {
                        this.invalidTradelink = true;
                    } else {
                        this.invalidTradelink = false;
                        localStorage.setItem(this.user.id, this.user.tradelink);
                        $('#tradelink').modal('hide');
                        this.$forceUpdate();
                    }
                } else {
                    this.invalidTradelink = true;
                }


            },
            reloadInventories: function() {
                this.disableReload = true;
                this.botInventory = [];
                this.botInventorySelected = [];
                this.botInventorySelectedValue = 0;
                this.userInventory = [];
                this.userInventorySelected = [];
                this.userInventorySelectedValue = 0;
                socket.emit('get bots inv');
                if(this.user && typeof this.user.steamID64 !== 'undefined') {
                    socket.emit('get user inv', this.user.steamID64);
                }
                ga('send', 'reloadInventories', {
                    eventCategory: 'Trade',
                    eventAction: 'click',
                    eventLabel: this.user.steamID64 || false
                });
            },            
            depositOffer: function() {
                if( ! localStorage[this.user.id]) {
                    $('#deposit_modal').modal('hide')
                    $('#tradelink').modal('show');
                } else {
                    this.offerStatus = {};
                    this.checkTradeable();
                    if( ! this.disableTrade) {
                        this.disableTrade = true;
                        $('#deposit_modal').modal('hide')
                        $('#tradeoffer').modal('show');
                        socket.emit('deposit offer', {
                            user: this.userInventorySelected,
                            bot: [],
                            bot_id: 'bot_3',
                            steamID64: this.user.id,
                            tradelink: localStorage[this.user.id],
                            id_coinflip: this.view_coinflip, 
                            total: this.userInventorySelectedValue,
                            type_deposit: "deposit",
                        });
                    }
                }
            },         
            withdrawOffer: function(){
                if( ! localStorage[this.user.id]) {
                    $('#withdraw').modal('hide')
                    $('#tradelink').modal('show');
                } else {
                    this.offerStatus = {};
                    this.checkTradeable();
                    if(this.botInventorySelected.length > 0) {
                        this.disableTrade = true;
                        $('#withdraw').modal('hide')
                        $('#tradeoffer').modal('show');
                        socket.emit('withdraw offer', {
                            user: [],
                            bot: this.botInventorySelected,
                            bot_id: 'bot_3',
                            steamID64: this.user.id,
                            tradelink: localStorage[this.user.id],
                            total: this.botInventorySelectedValue,
                        });
                    }
                }
            },
            
            newMessage : function(){
                if(this.user){
                    socket.emit('new message', {
                        msg : this.message
                    })
                    this.message = '';
                }
            },            
            betRoulette : function(rank){
                
                if(this.roulette_amount > 0 && this.countdownRoulette > 0 && !this.rolling && !this.preparing){
                    socket.emit('newBetRoulette', {rank: rank, amount: this.roulette_amount})
                }
            },            
            updateBet: function(game, value){
                if(game == 'roulette'){
                    if(value == 0){
                        this.roulette_amount = 0;
                    }else if(value == -1){
                        this.roulette_amount = this.user.coins
                    }else if(value == -2){
                        this.roulette_amount = this.roulette_amount * 2
                    }else if(value == -3){
                        this.roulette_amount = this.roulette_amount / 2
                    }else{
                        this.roulette_amount = this.roulette_amount + value
                    }
                }                
            },            
            testFreeCode : function(){
                if(this.freecode != ''){
                    socket.emit('freeCode', this.freecode)
                    $('#freecoins').modal('hide');
                }                
            },
            changeSound : function(){
                if(this.sound_enable){
                    this.sound_enable = false
                    this.text_volume = volumeDown
                }else{
                    this.sound_enable = true
                    this.text_volume = volumeUp
                }
                socket.emit('changeSound', this.sound_enable)
            },            
        }
    });
    $(document).on('click', '#tradelink_button', function(){
        if(!app.invalidTradelink && app.user.tradelink != ''){
            socket.emit('tradelink', app.user.tradelink)
        }
    })
    socket.on('freeCoinsRes', function(data){
        if(data == "WIN"){
            $("#freecoinsawarded").modal('show')
        }
    })
    socket.on('connected client', function(data){
        app.connected_client = data
    })
    socket.emit('get pricelist');
    socket.emit('get rates');
    socket.on('site', function(data) {
        app.site = data;
        window.document.title = data.header + ' | Gamble your Rust Skins';
    });
    socket.on('config', function(data){
        app.config_site = data
    })
    socket.on('init chat', function(data){
        app.chat = data;
    })
    socket.on('message', function(data){
        app.chat.unshift(data);
    })
    socket.on('offers', function(data){
        app.offers = []
        if(data.length < 1){
            app.nb_players = 0
            app.current_pot = 0
            app.current_chance = 0
            app.total_deposit = 0
        }
        for(var key in data){
            if(data[key].user){
                for(var key2 in data[key].offer.itemsToReceive){
                    if(data[key].offer.itemsToReceive[key2].price > 0){
                        app.offers.unshift({
                            user: data[key].user,
                            offer : data[key].offer.itemsToReceive[key2]
                        })
                        app.current_pot += parseInt(data[key].offer.itemsToReceive[key2].price * 100)
                        if(data[key].user[0]._id == app.user.id){
                            app.total_deposit += parseInt(data[key].offer.itemsToReceive[key2].price * 100)
                        }
                        app.current_chance = (app.total_deposit) * 100 / (app.current_pot)
                    }
                    
                }    
            }
        }
    })
    socket.on('history', function(data){
        app.history = data
    })
    socket.on('newOffer', function(data){
        for(var key in data.offer.itemsToReceive){
            app.offers.unshift({
                user : data.user,
                offer : data.offer.itemsToReceive[key]
            }) 
            app.current_pot += parseInt(data.offer.itemsToReceive[key].price * 100)
            if(data.user[0]._id == app.user.id){
                app.total_deposit += parseInt(data.offer.itemsToReceive[key].price * 100)
            }
            app.current_chance = (app.total_deposit) * 100 / (app.current_pot)
        }
        
    })


    socket.on('offer status', function(data) {
        app.offerStatus = data;
        if(data.status === 3 || data.status === false) {
            app.disableTrade = false;
        }
        if(data.status === 3) {
            app.botInventorySelected = [];
            app.botInventorySelectedValue = 0;
            app.userInventorySelected = [];
            app.userInventorySelectedValue = 0;
        }
    });

    socket.on('user', function(user) {
        console.log(user)
        user.steamID64 = user.id;
        app.user = user;

        if(app.user.steamID64) {
            socket.emit('get user inv', app.user.steamID64);
        }
        if(typeof app.user.tradelink === 'undefined' && app.user) {
            $('#tradelink').modal('show');
        }        
        if(!app.user){
            $('#overlay').css('display', 'block')
        }else{
            $('#overlay').css('display', 'none')
        }
        if(app.user && app.user.sound){
            app.sound_enable = true
            app.text_volume = volumeUp
        }else{
            app.sound_enable = false
            app.text_volume = volumeDown
        }
    });
    socket.on('user inv', function(data) {
        app.disableReload = false;
        if( ! data.error) {
            var userInventory = [];
            for(var i in data.items) {
                var item = data.items[i];
                if(app.priceList[item.data.market_hash_name] <= app.rates.trash) {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.user['trash']).toFixed(2);
                } else {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.user[item.item_type.name]).toFixed(2);
                }
                userInventory.push(item);
            }
            if( ! userInventory.length) {
                userInventory = { error: { error: 'No tradeable items found.' } };
            } else {
                userInventory = sortInventory(userInventory, true);
            }
            app.userInventory = userInventory;
        } else {
            app.userInventory = data;
        }
    });

    socket.on('bots floats', function(floats) {
        app.floats = floats;
    })

    socket.on('bots inv', function(items) {
        app.disableReload = false;
        // Order items object by key name
        const ordered = {};
        Object.keys(items).sort().forEach(function(key){
            ordered[key] = items[key];
        });
        // Assign ordered object to botInventories
        app.botInventories = Object.assign({}, ordered);

        var botInventory = [];
        var error = false;
        for(var i in items) {
            var bot = items[i];
            if(bot.error) {
                error = bot.error;
            }
            for(var y in bot.items) {
                var item = bot.items[y];
                item.bot = i;
                if(app.priceList[item.data.market_hash_name] <= app.rates.trash) {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.bot['trash']).toFixed(2);
                } else {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.bot[item.item_type.name]).toFixed(2);
                }
                botInventory.push(item);
            }
        }
        if( ! botInventory.length) {
            if( ! error) {
                error = { error: { error: 'No tradeable items found. Make sure all bots have items and are not set to private.' } };
            }
            botInventory = { error: error };
        } else {
            botInventory = sortInventory(botInventory, true);
        }
        app.botInventory = botInventory;
    });
    socket.on('pricelist', function(prices) {
        app.priceList = Object.assign({}, app.priceList, prices);

        socket.emit('get bots inv');
    });
    socket.on('rates', function(rates) {
        app.rates = Object.assign({}, app.rates, rates);
    });

    function sortInventory(inventory, desc) {
        return inventory.sort(function(a, b) {
            return (desc) ? b.price - a.price : a.price - b.price;
        });
    }
  
   
    function animateProgressBar(goTo, duration){
        if(page == 'ROULETTE'){
             $(".numbers").clearQueue();
            $(".numbers").stop();
            if(app.sound_enable){
                roll.play()
            }            
            $(".numbers").animate({ 
                left: "-=" + (goTo) + "px",
              }, {duration: duration, easing: "easeOutCirc"}, null, function(){        
                
            });
        }
       
    }

    //Roulette
    socket.on('countdownRoulette', function(data){    
        app.countdownRoulette = data 
        app.preparing = false
    })

    socket.on('endRoulette', function(data){
        if(page == 'ROULETTE'){
            $(".numbers").css('left', '0px')
            $('.numbers-container').html(app.toAppend)
            $('.numbers-arrow-helper').html(app.toAppend2)     
            app.rolling = true
            app.countdownRoulette = false

            var obj = $('.roulette-container');
            var childPos = obj.offset();

            var arrowPow = $('.' + data).eq($('.' + data).length - 1).offset();
           
            var rand = Math.floor(Math.random() * 75) + 3
            childPos = childPos.left + ($('.roulette-container').width() / 2);
            arrowPow = arrowPow.left
            animateProgressBar(arrowPow - childPos + rand, 10000)
        }        
    })

    socket.on('countdownRoulettePrepare', function(data){   
        if(page == 'ROULETTE'){
            if(app.rolling && app.sound_enable){
                bip.play()
            }
            app.preparing = data
            app.rolling = false
        }
        
    })

    socket.on('rouletteBets', function(data){
        app.currentBet = data
        app.red_bets = 0
        app.green_bets = 0
        app.black_bets = 0
        data[0].forEach(function(greenbet){
            app.green_bets += greenbet.amount
        })
        data[1].forEach(function(redbet){
            app.red_bets += redbet.amount
        })
        data[2].forEach(function(blackbet){
            app.black_bets += blackbet.amount
        })
    })
    socket.on('updateCoins', function(data){
        app.user.coins = app.user.coins - data
    })
    socket.on('updateAllCoins', function(data){
        if(data.steamid == app.user.id){
            app.user.coins = app.user.coins + data.amount
        }
    })

    socket.on('notify', function(data){
        $.notify({
                // options
                message: data 
            },{
                // settings
                type: 'danger'
            });
    })
    socket.on('notifyAll', function(data){
        if(data.steamid == app.user.id){
            $.notify({
                // options
                message: data.error
            },{
                // settings
                type: 'danger'
            });
        }
    })
    socket.on('notifyAllSuccess', function(data){
        if(data.steamid == app.user.id){
            $.notify({
                // options
                message: data.error
            },{
                // settings
                type: 'success'
            });
        }
    })
    socket.on('historyRoulette', function(data){
        app.historyRoulette = data
    })
});
