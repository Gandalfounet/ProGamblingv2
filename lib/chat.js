const MongoClient = require('mongodb').MongoClient
let url = "mongodb://localhost:27017/"
let db_name ="panda"
let db_user = "users"
let db_chat = "chat"


function ChatModel(){
  this.chat = []
}

ChatModel.prototype.InitChat = function(callback){
  MongoClient.connect(url, function(err, db) {
      if (err) return callback(err)
      var dbo = db.db(db_name)
      dbo.collection(db_chat).find().sort({_id:-1}).limit(5).toArray(function(err, result) {
        if (err) return callback(err)
        db.close()
        if(result.length > 0){         
            return callback(null, result)
        }else{
            return callback("Chat is empty", null)
        }
      })
    })
}

ChatModel.prototype.newMessage = function(message, callback){
  MongoClient.connect(url, function(err, db) {
      if (err) return callback(err)
      var dbo = db.db(db_name)
      dbo.collection(db_chat).insert({
        user_id : message.user_id,
        username : message.username,
        logo : message.logo,
        message : message.message,
        date : Date.now(),
        rank: message.rank,
      })
      return callback(null, null)
    })
}

module.exports = ChatModel