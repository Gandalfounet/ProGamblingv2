const MongoClient = require('mongodb').MongoClient
let url = "mongodb://localhost:27017/"
let db_name ="panda"
let db_user = "users"
let transactions_jackpot_deposit = "transactions_jackpot_deposit"
let transactions_jackpot_sent = "transactions_jackpot_sent"
let transactions_coinflip_deposit = "transactions_coinflip_deposit"
let transactions_coinflip_sent = "transactions_coinflip_sent"
let transaction_deposit = "transactions_deposit"
let transaction_withdraw = "transactions_withdraw"

function TransactionModel(){

}

TransactionModel.prototype.insertTr = function(transaction, base, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myobj = { 
	  				offer: transaction,
	  				date: new Date()
	  			  }
	  dbo.collection(base).insertOne(myobj, function(err, res) {
	    db.close()
	    if (err) return callback(err)
		return callback(null, true)
	    
	  })
	})
}

TransactionModel.prototype.getDepositedAmount = function(steamid, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  dbo.collection("transactions_deposit").find({"offer.steamid" : steamid}).toArray(function(err, result) {
	    if (err) return callback(err)
	    db.close()
	     if(result.length > 0){	  
	     	let total_offer = 0;  	
	     	for(var key in result){
	     		total_offer += result[key].offer.total
	     	}
	    	return callback(null, total_offer)
	    }else{
	    	return callback(null, 0)
	    }
	  })
	})
}

TransactionModel.prototype.getWithdrawItemAmount = function(steamid, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  dbo.collection("transactions_withdraw").find({"offer.steamid" : steamid}).toArray(function(err, result) {
	    if (err) return callback(err)
	    db.close()
	    if(result.length > 0){	  
	     	let total_offer_withdraw = 0;  	
	     	for(var key in result){
	     		var now = new Date()
	     		var createdat = new Date(result[key].offer.created)
	     		console.log('now : ' + now)
	     		console.log('createdat : ' + createdat)
	     		if(now - createdat < (60000*60*24)){
	     			total_offer_withdraw++
	     		}
	     	}
	    	return callback(null, total_offer_withdraw)
	    }else{
	    	return callback(null, 0)
	    }
	  })
	})
}
module.exports = TransactionModel