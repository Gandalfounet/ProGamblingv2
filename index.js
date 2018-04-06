'use strict'

// Modules
const express = require('express')

const app = express()
var leStore = require('le-store-certbot').create({
  configDir: '~/letsencrypt/etc',          // or /etc/letsencrypt or wherever
  privkeyPath: ':configDir/live/:hostname/privkey.pem',          //
  fullchainPath: ':configDir/live/:hostname/fullchain.pem',      // Note: both that :configDir and :hostname
  certPath: ':configDir/live/:hostname/cert.pem',                //       will be templated as expected by
  chainPath: ':configDir/live/:hostname/chain.pem',              //       node-letsencrypt
  workDir: '~/letsencrypt/var/lib',
  logsDir: '~/letsencrypt/var/log',
  webrootPath: '~/letsencrypt/srv/www/:hostname/.well-known/acme-challenge',
  debug: false
});


// returns an instance of node-letsencrypt with additional helper methods
var lex = require('letsencrypt-express').create({
  // set to https://acme-v01.api.letsencrypt.org/directory in production
  //server: 'staging',
  server: 'https://acme-v01.api.letsencrypt.org/directory',

  // If you wish to replace the default plugins, you may do so here
  //
  challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: '~/letsencrypt/var/acme-challenges' }) },
  store: leStore,


  // You probably wouldn't need to replace the default sni handler
  // See https://github.com/Daplie/le-sni-auto if you think you do
  //, sni: require('le-sni-auto').create({})

  approveDomains: approveDomains
});

function approveDomains(opts, certs, cb) {
  // TODO - verify domain

  if (certs) {
     opts.domains = certs.altnames;
   }
  else {
     opts.email = 'progambling.dev@gmail.com';
     opts.agreeTos = true;
  }

  cb(null, { options: opts, certs: certs });
}

// handles acme-challenge and redirects to https
require('http').createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});

const server = require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
  console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
});

// const server = require('http').Server(app)
const io = require('socket.io')(server)
const fs = require('fs')
const passport = require('passport')
const steamIDID = require('steamid')

const session = require('express-session')
const sharedsession = require('express-socket.io-session')
const SteamStrategy = require('passport-steam').Strategy
// Site stuff
const TradeBot = require('./lib/index')
const UserModel = require('./lib/user')
const ChatModel = require('./lib/chat')
const TransactionModel = require('./lib/transaction')

const User = new UserModel();
const Chat = new ChatModel();
const Transaction = new TransactionModel();

const Trade = new TradeBot({ io })
const config = require('./config')

// Web server
// server.listen(config.websitePort)
console.log('[!] Website server is online.')
console.log('[!] Socket server is online.')
// Passport
passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((obj, done) => {
    done(null, obj)
})
passport.use(new SteamStrategy({
    returnURL: `${config.website}/auth/steam/return`,
    realm: `${config.website}/`,
    apiKey: config.steamApiKey,
},
(identifier, profile, done) => {
    process.nextTick(() => {
        const user = profile
        user.identifier = identifier
        return done(null, user)
    })
}))
const sessionMiddleware = session({
    secret: 'lesponeyssontblanches31320!',
    name: 'PGM',
    resave: true,
    saveUninitialized: true,
})
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
app.use('/static', express.static('./template/' + config.theme + '/static'))

// Routes
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/template/` + config.theme + `/view/roulette.html`)
})
app.get('/roulette', (req, res) => {
    res.sendFile(`${__dirname}/template/` + config.theme + `/view/roulette.html`)
});

// Auth Routes
app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/auth/steam' }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/')
})
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})
// Sockets
io.use(sharedsession(sessionMiddleware))

let clients = [];
//Main connection with clients

io.on('connection', (socket) => {

    var address = socket.handshake.address;
    if(!(address in clients)){
        clients[address] = 1;
    }
  
    var size = Object.keys(clients).length;
    io.emit('connected client', size);
    socket.on('disconnect', function(){
        delete clients[address];
        var size = Object.keys(clients).length;
        io.emit('connected client', size);
    });


    let userObject = false
    let incrashz = false
    if (
        typeof socket.handshake.session.passport !== 'undefined' &&
        typeof socket.handshake.session.passport.user !== 'undefined' &&
        typeof socket.handshake.session.passport.user.id !== 'undefined'
    ) { 
        userObject = socket.handshake.session.passport.user
        User.getUser(userObject.id, (err, result) => {
            if(err) throw err
            if(result){         
                if(result[0].tradelink){
                    userObject.tradelink = result[0].tradelink;
                }
                userObject.coins = result[0].coins                
                userObject.sound = result[0].sound    
                userObject.total_spent_Roulette = result[0].total_spent_Roulette; //Amount of $ spent in roulette
                userObject.total_won_Roulette = result[0].total_won_Roulette; //Amount of $ won in roulette

                socket.emit('user', userObject) 
            }else{                
                User.insertUser({steamID64 : userObject.id, username: userObject.displayName, logo : userObject.photos[2].value, colorCF: 'red'}, (err, res) =>{
                    if(err) throw err;
                    userObject.coins = 0
                    userObject.total_spent_Roulette = 0; //Amount of $ spent in roulette
                    userObject.total_won_Roulette = 0; //Amount of $ won in roulette
                    console.log('User ' + userObject.id + ' inserted in database.')
                    socket.emit('user', userObject) 
                })
            }
        })
    }else{
        socket.emit('user', false) 
    }
    socket.on('changeSound', function(data){
        if(userObject){
            User.updateUser(userObject.id, {sound: data}, (err, res) => {

            })
        }
    })
    socket.emit('site', config.site)
    socket.emit('config', {
        sitename: config.site_name,
        max_item: config.max_item,
        min_deposit: config.min_deposit,
        fee: config.fee,
        fee_reduc: config.fee_reduc,
    })
    socket.on('tradelink', function(data){
        if(userObject){
            var accountID = (new steamIDID(userObject.id)).accountid;
            if(data.includes(accountID)){
                User.updateUser(userObject.id, {tradelink: data}, (err, res)=>{

                })
            }else{
                socket.emit('notify', "Your account does not own this tradelink.")
            }
            
        }else{
            socket.emit('notify', "You need to be logged in.")
        }
        
    })

    Chat.InitChat(function(err, res){
        if(!err)
            socket.emit('init chat', res);
    });

    socket.emit('rouletteBets' , Trade.getCurrentRBet())

    socket.emit('historyRoulette', Trade.getHistoryRoulette())


    socket.on('new message', (message) =>{
        if(userObject){
            if(config.admins.includes(userObject.id)){
                var msg = {
                        user_id : userObject.id,
                        username : userObject.displayName + " [Admin]",
                        logo : userObject.photos[2].value,
                        message : message.msg

                    }
            }else{
                var msg = {
                        user_id : userObject.id,
                        username : userObject.displayName,
                        logo : userObject.photos[2].value,
                        message : message.msg

                    }
            }
            
            if(message.msg != '' && message.msg.substring(0,1) == '/'){
                //Here is a command         
                    if(config.admins.includes(userObject.id)){
                        //Split the commands
                        let command = message.msg.split(" ")
                        command[0] = command[0].substr(1)
                        if(command[0] == "ban" || command[0] == "unban"){
                            if(command[0] == "ban"){
                                User.updateUser(command[1], {ban: 1}, (err, res) => {
                                    socket.emit('notify', command[1] + " has been banned.")
                                })
                            }else if(command[0] == "unban"){
                                User.updateUser(command[1], {ban: 0}, (err, res) => {
                                    socket.emit('notify', command[1] + " has been unbanned.")
                                })
                            }
                        }else if(command[0] == "mute" || command[0] == "unmute"){
                            if(command[0] == "mute"){
                                User.updateUser(command[1], {mute: 1}, (err, res) => {
                                    socket.emit('notify', command[1] + " has been muted.")
                                })
                            }else if(command[0] == "unmute"){
                                User.updateUser(command[1], {mute: 0}, (err, res) => {
                                    socket.emit('notify', command[1] + " has been unmuted.")
                                })
                            }
                        }
                    }
            }else if(message.msg != ''){
                User.getUser(userObject.id, (err, user) => {
                    if(user[0].ban != 1 && user[0].mute != 1){
                        var total_bet = user[0].total_spent_JP + user[0].total_spent_CF + (user[0].total_spent_Crash/100) + (user[0].total_spent_Roulette/100)
                        var rank = parseInt(total_bet / 10)
                        msg.rank = rank
                        Chat.newMessage(msg, (err, res) => {
                            //Update the chat
                            io.emit('message', msg)
                        })
                    }                    
                })
                
            }            
        }else{
            socket.emit('notify', "You need to be logged in.")
            
        }
    })

    socket.on('get user inv', (steamID64) => {
        Trade.getInventory(steamID64, config.appID, config.contextID, (err, data) => {
            socket.emit('user inv', { error: err, items: data })
        })
    })
    socket.on('get bot inv', (id) => {
        Trade.getInventory(config.bots[id].steamID64, config.appID, config.contextID, (err, data) => {
            socket.emit('bot inv', { error: err, items: data })
        })
    })
    socket.on('get bots inv', () => {
        const params = []
        // Object.keys(config.bots).forEach((index) => {
            const bot = config.bots["bot_3"]
            params.push({
                id: "bot_3",
                steamID64: bot.steamID64,
                appID: config.appID,
                contextID: config.contextID,
            })
        // })
        Trade.getInventories(params, (data) => {
            socket.emit('bots inv', data)
            socket.emit('bots floats', Trade.getFloatValues())
        })
    })
    socket.on('get pricelist', () => {
        socket.emit('pricelist', Trade.getPriceList())
    })
    socket.on('get rates', () => {
        socket.emit('rates', {
            ignore: Trade.getIgnorePrice(),
            trash: Trade.getTrashPrice(),
            user: Trade.getUserRates(),
            bot: Trade.getBotRates(),
        })
    })
    
    socket.on('newBetRoulette', function(data){
        const amount = parseFloat(data.amount)
        const rank = parseInt(data.rank)
        if(userObject && amount > 0){
            User.getUser(userObject.id, (err, userr) => {
                if(userr[0].coins >= amount){
                    
                            User.updateUserCoin(userObject.id, -amount, (err, ress) =>{
                                User.updateUserInc(userObject.id, {total_spent_Roulette: amount}, (err, res) => {
                                    Trade.newBetR({
                                        user: userr,
                                        amount: amount,
                                        rank: rank
                                    }, (err, res) =>{    
                                        if(res){
                                            io.emit('rouletteBets', res)
                                            socket.emit('updateCoins', amount)
                                        }else{
                                            socket.emit('notify', "An error occured.")
                                        }
                                        
                                    })
                                })
                                
                            })
                        

                }else{
                    socket.emit('notify', "You don\'t have enough credits.")
                }
                
            }) 
        }
        
    })
  

    //WITHDRAW
    socket.on('withdraw offer', (data) => {
        const link = data.tradelink
        const offerData = data
        const total_offer = data.total
        
        if(!config.youtubers.includes(data.steamID64)){
            User.getUser(data.steamID64, (err, res) => {                
                if(err) console.log(err)
                if(res.length > 0){
                    socket.emit('offer status', {
                                            error: null,
                                            status: 4,
                                        })
                    if(res[0].tradelink != ''){
                        // if(res[0].withdrawing == 0){
                        if(true){
                            Transaction.getDepositedAmount(data.steamID64, (err, depositedAmount) => {
                                if(err) console.log(err)
                                console.log('Got the deposited amount : ' + depositedAmount)
                                if(depositedAmount > 2 && offerData.bot.length <= 3){
                                    Transaction.getWithdrawItemAmount(data.steamID64, (errr, withdrawnItem) => {
                                        console.log('Got the withdraw item amount : ' + withdrawnItem)
                                            if(errr) console.log(errr)
                                            if(withdrawnItem + offerData.bot.length > 3){
                                                socket.emit('offer status', {
                                                            error: 'You can\'t withdraw more than 3 items / day!',
                                                            status: false,
                                                        })
                                            }else{
                                                if(res[0].coins >= (total_offer*100)){                                        
                                                    let canTrade = true;
                                                    if (
                                                        link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
                                                        link.indexOf('?partner=') === -1 ||
                                                        link.indexOf('&token=') === -1
                                                    ) {
                                                        socket.emit('offer status', {
                                                            error: 'Invalid trade link!',
                                                            status: false,
                                                        })
                                                    } else {
                                                        //Calculate the price here
                                                        if(canTrade){
                                                            let params = {}
                                                            params.tradelink = link            
                                                            
                                                            const Bot = Trade.getBot(offerData.bot_id)
                                                            const offer = Bot.manager.createOffer(offerData.tradelink)
                                                            offer.addMyItems(offerData.bot.map(assetid => ({
                                                                assetid,
                                                                appid: config.appID,
                                                                contextid: config.contextID,
                                                                amount: 1,
                                                            })))
                                                            offer.setMessage(config.tradeMessage)
                                                            offer.getUserDetails((detailsError, me, them) => {
                                                                if (detailsError) {
                                                                    socket.emit('offer status', {
                                                                        error: detailsError,
                                                                        status: false,
                                                                    })
                                                                } else if (me.escrowDays + them.escrowDays > 0) {
                                                                    socket.emit('offer status', {
                                                                        error: 'You must have 2FA enabled, we do not accept trades that go into Escrow.',
                                                                        status: false,
                                                                    })
                                                                } else {
                                                                    User.updateUserCoin(userObject.id, -(total_offer*100), (err, ress) =>{
                                                                                            socket.emit('updateCoins', (total_offer*100))
                                                                                        })
                                                                    offer.send((errSend, status) => {
                                                                        offer.steamid = data.steamID64
                                                                        Transaction.insertTr(offer, "transactions_withdraw", (err, res) =>{
                                                                        
                                                                        })
                                                                        if (errSend) {
                                                                            socket.emit('offer status', {
                                                                                error: errSend,
                                                                                status: false,
                                                                            })
                                                                        } else {
                                                                            console.log('[!!!!!] Sent a trade: ', data)
                                                                            if (status === 'pending') {
                                                                                socket.emit('offer status', {
                                                                                    error: null,
                                                                                    status: 2,
                                                                                })
                                                                                Trade.botConfirmation(data.bot_id, offer.id, (errConfirm) => {
                                                                                    if (!errConfirm) { 
                                                                                        socket.emit('offer status', {
                                                                                            error: null,
                                                                                            status: 3,
                                                                                            offer: offer.id,
                                                                                        })
                                                                                        
                                                                                    } else {
                                                                                        console.log(errConfirm)
                                                                                        socket.emit('offer status', {
                                                                                            error: errConfirm,
                                                                                            status: false,
                                                                                        })
                                                                                    }
                                                                                })
                                                                            } else {
                                                                                socket.emit('offer status', {
                                                                                    error: null,
                                                                                    status: 3,
                                                                                    offer: offer.id,
                                                                                })
                                                                            }
                                                                        }
                                                                    })
                                                                }
                                                            })

                                                        }
                                                        
                                                    }
                                                }else{
                                                    socket.emit('offer status', {
                                                        error: "You dont have enough credits.",
                                                        status: false,
                                                    })  
                                                }
                                            }
                                    })
                                        
                                }else{
                                    if(depositedAmount < 2){
                                        socket.emit('offer status', {
                                                            error: 'You need to deposit at least 2$ before being able to withdraw.',
                                                            status: false,
                                                        })
                                    }else if(offerData.bot.length > 3){
                                        socket.emit('offer status', {
                                                            error: 'You can\'t withdraw more than 3 items / day!',
                                                            status: false,
                                                        })
                                    }
                                    
                                }
                            })
                                 
                        }else{
                            socket.emit('offer status', {
                                    error: 'You currently have a withdraw on going!',
                                    status: false,
                            })
                        }
                    }else{       
                        socket.emit('offer status', {
                            error: "Wrong tradelink.",
                            status: false,
                        }) 
                    }
                }                               
            })
        }else{
            socket.emit('offer status', {
                        error: 'You are youtuber, you can\'t withdraw through this panel.',
                        status: false,
                    })
        }
        
        
        
        

            

        
    })

    //Free code sockets
    socket.on('freeCode', function(data){
        if(data != '' && userObject){
            User.getUser(userObject.id, (err, user) => {
                if(user[0].code_used && user[0].code_used.length > 0){
                    let allowed = true
                    for(var key in user[0].code_used){
                        if(user[0].code_used[key].toLowerCase() == data.toLowerCase()){
                           allowed = false 
                        }
                    }
                    if(allowed){
                        User.getFreeCode((err, freecodes) => {
                            freecodes.forEach(function(freecode){
                                if(freecode.code.toLowerCase() == data.toLowerCase()){
                                    //The coupon is validated                                
                                    User.updateUserPush(userObject.id, {code_used: data}, (err, ress) =>{
                                        User.updateUserCoin(userObject.id, freecode.amount, (err, res) => {
                                            socket.emit('updateCoins', -freecode.amount)
                                            socket.emit('freeCoinsRes', "WIN")
                                        })
                                    })                                
                                }
                            })
                        })
                    }else{
                        socket.emit('notify', "You already used this code.")
                    }
                    
                }else{
                    User.getFreeCode((err, freecodes) => {
                        freecodes.forEach(function(freecode){
                            if(freecode.code.toLowerCase() == data.toLowerCase()){
                                //The coupon is validated                                
                                User.updateUserPush(userObject.id, {code_used: data}, (err, ress) =>{
                                    User.updateUserCoin(userObject.id, freecode.amount, (err, res) => {
                                        socket.emit('updateCoins', -freecode.amount)
                                        socket.emit('freeCoinsRes', "WIN")
                                    })
                                })                                
                            }
                        })
                    })
                    
                }
            })
        }
    })




    //Deposit
    socket.on('deposit offer', (data) => {
        socket.emit('offer status', {
            error: null,
            status: 4,
        })
        const link = data.tradelink
        const offerData = data
        const total_offer = data.total
        
        if (
            link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
            link.indexOf('?partner=') === -1 ||
            link.indexOf('&token=') === -1
        ) {
            socket.emit('offer status', {
                error: 'Invalid trade link!',
                status: false,
            })
        } else {
            //Calculate the price here
            User.getUser(userObject.id, (err, userrz) => {
                if(userrz){
                    var canTrade = true;
                    if(total_offer <  config.min_deposit){
                        canTrade = false
                    }
                    if(canTrade){
                        let params = {}
                        params.tradelink = link            
                        Trade.validateOffer(offerData, (err, success) => {
                            socket.emit('offer status', {
                                error: err,
                                status: (success) ? 1 : false,
                            })
                            if (!err && success) {
                                if (typeof config.bots[offerData.bot_id] === 'undefined') {
                                    offerData.bot_id = Object.keys(config.bots)[0]
                                }
                                const Bot = Trade.getBot(offerData.bot_id)
                                const offer = Bot.manager.createOffer(offerData.tradelink)
                                offer.addTheirItems(offerData.user.map(assetid => ({
                                    assetid,
                                    appid: config.appID,
                                    contextid: config.contextID,
                                    amount: 1,
                                })))
                                offer.setMessage(config.tradeMessage)
                                offer.getUserDetails((detailsError, me, them) => {
                                    if (detailsError) {
                                        socket.emit('offer status', {
                                            error: detailsError,
                                            status: false,
                                        })
                                    } else if (me.escrowDays + them.escrowDays > 0) {
                                        socket.emit('offer status', {
                                            error: 'You must have 2FA enabled, we do not accept trades that go into Escrow.',
                                            status: false,
                                        })
                                    } else {
                                        offer.send((errSend, status) => {                                    
                                            if (errSend) {
                                                socket.emit('offer status', {
                                                    error: errSend,
                                                    status: false,
                                                })
                                            } else {
                                                console.log('[!!!!!] Sent a trade: ', data)
                                                if (status === 'pending') {
                                                    socket.emit('offer status', {
                                                        error: null,
                                                        status: 2,
                                                    })
                                                    Trade.botConfirmation(data.bot_id, offer.id, (errConfirm) => {
                                                        if (!errConfirm) {
                                                            offer.steamid = userObject.id
                                                            offer.total = total_offer
                                                            if(data.type_deposit == "deposit"){
                                                                Transaction.insertTr(offer, "transactions_deposit", (err, res) =>{

                                                                })
                                                                Trade.startCheckingDeposit(offer.id, userObject.id, total_offer) 
                                                            }
                                                                   

                                                            socket.emit('offer status', {
                                                                error: null,
                                                                status: 3,
                                                                offer: offer.id,
                                                            })
                                                        } else {
                                                            console.log(errConfirm)
                                                            socket.emit('offer status', {
                                                                error: errConfirm,
                                                                status: false,
                                                            })
                                                        }
                                                    })
                                                } else {
                                                    offer.steamid = userObject.id
                                                    offer.total = total_offer
                                                    if(data.type_deposit == "deposit"){
                                                        Transaction.insertTr(offer, "transactions_deposit", (err, res) =>{

                                                        })
                                                        Trade.startCheckingDeposit(offer.id, userObject.id, total_offer) 
                                                    }                                   
                                                    socket.emit('offer status', {
                                                        error: null,
                                                        status: 3,
                                                        offer: offer.id,
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }else{
                        socket.emit('offer status', {
                                            error: "The value of your deposit is wrong.",
                                            status: false,
                                        })
                    }
                }
            })
            
            
        }        
    })
})
 