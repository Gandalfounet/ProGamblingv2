const MongoClient = require('mongodb').MongoClient
let url = "mongodb://localhost:27017/"
let db_name ="panda"
let db_user = "users"

function UserModel(){

}

UserModel.prototype.getUser = function(steamID64, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  dbo.collection(db_user).find({_id : steamID64}).toArray(function(err, result) {
	    if (err) return callback(err)
	    db.close()
	     if(result.length > 0){	    	
	    	return callback(null, result)
	    }else{
	    	return callback(null, null)
	    }
	  })
	})
}


UserModel.prototype.updateUser = function(steamID64, params, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myquery = { _id: steamID64 }
	  var newvalues = {$set:{}}
	  for(var key in params){
	  	newvalues.$set[key] = params[key]
	  }
	  dbo.collection(db_user).updateOne(myquery, newvalues, function(err, res) {
	    if (err) return callback(err)
	    db.close()
		return callback(null, res);
	  })
	})
}
UserModel.prototype.updateUserPush = function(steamID64, params, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myquery = { _id: steamID64 }
	  var newvalues = {$push:{}}
	  for(var key in params){
	  	newvalues.$push[key] = params[key]
	  }
	  dbo.collection(db_user).updateOne(myquery, newvalues, function(err, res) {
	    if (err) return callback(err)
	    db.close()
		return callback(null, res);
	  })
	})
}
UserModel.prototype.updateUserCoin = function(steamID64, amount, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myquery = { _id: steamID64 }
	  var newvalues = {$inc:{coins : amount}}
	  
	  console.log(newvalues)
	  dbo.collection(db_user).updateOne(myquery, newvalues, function(err, res) {
	    if (err) return callback(err)
	    db.close()
		return callback(null, res);
	  })
	})
}
UserModel.prototype.insertUser = function(user, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myobj = { _id: user.steamID64, 
	  				username: user.username,
	  				logo: user.logo,
	  				colorCF: user.colorCF,
	  				coins: 0,
	  				sound: true,
	  				total_spent_JP : 0, //Amount of $ spent in JP
                    total_won_JP : 0, //Amount of $ won in JP
                    total_played_JP : 0, //Amount of game played
                    total_played_win_JP : 0, //Amount of game won

                    total_spent_CF : 0, //Amount of $ spent in CF
                    total_won_CF : 0, //Amount of $ won in CF
                    total_played_CF : 0, //Amount of game played
                    total_played_win_CF : 0, //Amount of game won

                    total_spent_Crash : 0, //Amount of $ spent in crash
                    total_won_Crash : 0, //Amount of $ won in crash

                    total_spent_Roulette : 0, //Amount of $ spent in roulette
                    total_won_Roulette : 0, //Amount of $ won in roulette
	  			  }
	  dbo.collection(db_user).insertOne(myobj, function(err, res) {
	    db.close()
	    if (err) return callback(err)
		return callback(null, true)
	    
	  })
	})
}

UserModel.prototype.updateUserInc = function(steamID64, params, callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  var myquery = { _id: steamID64 }
	  var newvalues = {$inc:{}}
	  for(var key in params){
	  	newvalues.$inc[key] = params[key]
	  }
	  console.log(newvalues)
	  dbo.collection(db_user).updateOne(myquery, newvalues, function(err, res) {
	    if (err) return callback(err)
	    db.close()
		return callback(null, res);
	  })
	})
}
UserModel.prototype.getFreeCode = function(callback){
	MongoClient.connect(url, function(err, db) {
	  if (err) return callback(err)
	  var dbo = db.db(db_name)
	  dbo.collection("free_code").find({}).toArray(function(err, result) {
	    if (err) return callback(err)
	    db.close()
	    if(result.length > 0){	    	
	    	return callback(null, result)
	    }else{
	    	return callback(null, null)
	    }
	  })
	})
}
module.exports = UserModel