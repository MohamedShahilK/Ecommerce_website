let MongoClient = require('mongodb').MongoClient
let dbState = {
    dbName : null

}


module.exports.connect = function(done){

    let url = 'mongodb://localhost:27017'
    let dbName = 'shopping'
    MongoClient.connect(url, function(err, data) {
        if (err) return done(err);
        
        dbState.dbName = data.db(dbName)
        done()
      });
}

module.exports.get = ()=>{
    return dbState.dbName;
}
