'use strict'

const config = require('../config')
const MongoClient = require('mongodb').MongoClient
const url = "mongodb://localhost:27017/"
const db_name ="panda"
const db_user = "users"
const db_roulette = "roulette"
const db_history = "roulette_history"
const time_roulette = 10
const time_prepare_roulette = 1
const Trade = require('./index')
const UserModel = require('./user')
const User = new UserModel();

Trade.prototype.startRoulette = function(){
	this.id_roulette++
	this.timerRoulette = time_roulette
	this.io.emit('countdownRoulette', this.timerRoulette)	
	this.insertRoulette(this.id_roulette, (err, res) => {

	})	
	var that = this
	this.intervalRoulette = setInterval(function(){
		that.countdownRoulette(that)
	}, 1000)
}

Trade.prototype.insertRoulette = function(id_roulette, callback){
	var that = this
	var hash = this.makeid(40) 
	this.hashRoulette = hash
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myobj = { id_roulette: id_roulette,
	  				hash: hash,
	  				created_at: new Date()		
	  			  }
	  dbo.collection(db_roulette).insertOne(myobj, function(err, res) {
	    db.close()
	    if (err) return callback(err)
		return callback(null, true)
	    
	  })
	})
}
Trade.prototype.updateRoulette = function(params, callback){
	var that = this
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myquery = { hash: that.hashRoulette }
	  var newvalues = {$set:{}}
	  for(var key in params){
	  	newvalues.$set[key] = params[key]
	  }
	  dbo.collection(db_roulette).updateOne(myquery, newvalues, function(err, res) {
	    if (err) return callback(err)
	    db.close()
		return callback(null, res);
	  })
	})
}
Trade.prototype.makeid = function(length = 25) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
Trade.prototype.countdownRoulette = function(object){
	if(object.timerRoulette > 0){
		object.timerRoulette--
		object.io.emit('countdownRoulette', object.timerRoulette)		
	}else{

		clearInterval(object.intervalRoulette)
		object.intervalRoulette = false
		let win_number = Math.floor(Math.random() * 15)
		if(object.historyRoulette.length >= 5){
			object.historyRoulette.shift()
		}
		if(win_number == 0){
			object.historyRoulette.push({win_number: win_number, style:'linear-gradient(180deg, #07ab54, #0c7d3d)'})
		}else if(win_number < 8){
			object.historyRoulette.push({win_number: win_number, style:'linear-gradient(180deg, #bb2e30, #962224)'})
		}else{
			object.historyRoulette.push({win_number: win_number, style:'#202025'})
		}
		object.updateRoulette({win_number: win_number, players:object.currentRouletteBet}, (err, res) => {

		})
		object.giveCoins(win_number, object.currentRouletteBet)
		object.io.emit('endRoulette', win_number)		
		object.prepareRoulette(object) 
	}
}
Trade.prototype.countdownRoulettePrepare = function(object){
	object.io.emit('rouletteBets', object.currentRouletteBet)
	if(object.preparingRoulette > 0){
		object.preparingRoulette--
		object.io.emit('countdownRoulettePrepare', object.preparingRoulette)
	}else{
		clearInterval(object.intervalRoulette)
		object.intervalRoulette = false
		object.preparingRoulette = time_prepare_roulette
		object.startRoulette()
	}
	
} 
Trade.prototype.giveCoins = function(win, bets){
	var that = this
	let index = 0;
	let toIncrease = 14
	if(win > 0 && win < 8){
		index = 1;
		toIncrease = 2
	}else if(win > 7){
		index = 2;
		toIncrease = 2
	}
	//Update each user in bets coins
	bets[index].forEach(function(bet){
		console.log(bet)
		User.updateUserCoin(bet.user[0]._id, (bet.amount * toIncrease), (err, ress) => {
            // io.emit('rouletteBets', res)
            // socket.emit('updateCoins', amount)
            User.updateUserInc(bet.user[0]._id, {total_won_Roulette: (bet.amount * toIncrease)}, (err, res) => {

  			})
            setTimeout(function(){

            	that.io.emit('updateAllCoins', {steamid: bet.user[0]._id, amount: (bet.amount * toIncrease)})
            }, 10000)            
        })
	})
	
	setTimeout(function(){
		that.io.emit('historyRoulette', that.historyRoulette)
	}, 10000)
}
Trade.prototype.prepareRoulette = function(object){
	object.currentRouletteBet = []
	object.currentRouletteBet[0] = []
    object.currentRouletteBet[1] = []
    object.currentRouletteBet[2] = []

	setTimeout(function(){
		object.io.emit('countdownRoulettePrepare', object.preparingRoulette)
		object.intervalRoulette = setInterval(function(){
			object.countdownRoulettePrepare(object)
		}, 1000)
	}, 10000)
	
} 
Trade.prototype.getCurrentRBet = function(){
	return this.currentRouletteBet
}
Trade.prototype.newBetR = function(params, callback){
	console.log(params)
	console.log('CACA')
	console.log(this.currentRouletteBet)
	if(params.rank == 0 ||params.rank == 1 ||params.rank == 2){
		this.currentRouletteBet[params.rank].push({
			user: params.user,
			amount: params.amount
		})
		return callback(null, this.currentRouletteBet)
	}else{
		return callback("invalid bet")
	}
	
	
	
	
}

Trade.prototype.getHistoryRoulette = function(){
	return this.historyRoulette
}