//jshint esversion: 8

const consts = require('./constants/consts');
const functions = require('./constants/functions');

module.exports  = {

  insertToDB : function(query, collection, logBool) {
      return new Promise((resolve, reject) => {
          try {
            if(logBool) {
              console.log("insertToDB -> " + collection);
            }
            delete query._id;
            if("msgId" in query) {
              query.msgId = parseInt(query.msgId);
            }
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).insertOne(query, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    if(result != null && logBool) {
                      console.log("inserted to " + collection);
                      console.log(result.ops);
                    } else if(logBool){
                      console.log("not inserted to " + collection);
                      console.log(query);
                    }
                    resolve("");
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  insertToDBWithoutMsgContentLog : function(query, collection) {
      return new Promise((resolve, reject) => {
          try {
            console.log("insertToDBWithoutMsgContentLog -> " + collection);
            if("msgId" in query) {
              query.msgId = parseInt(query.msgId);
            }
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).insertOne(query, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    console.log("inserted to " + collection);
                    var arr = result.ops;
                    if(arr[0].format != consts.formatText) {
                      arr[0].msgContent = "";

                    }
                    console.log(arr);
                    resolve("");
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  updateCollection : function(query, toChange , collection) {
      return new Promise((resolve, reject) => {
          try {
            console.log("updateCollection -> " + collection);
            console.log(toChange);
            if("msgId" in query) {
              query.msgId = parseInt(query.msgId);
            }
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).updateOne(query, {$set : toChange}, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    resolve("");
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  updateManyFromCollection : function(query, toChange , collection) {
      return new Promise((resolve, reject) => {
          try {
            if("msgId" in query) {
              query.msgId = parseInt(query.msgId);
            }
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).updateMany(query, {$set : toChange}, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    resolve("");
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  updateOneFromCollectionWithUpsert : function(query, toChange , collection) {
      return new Promise((resolve, reject) => {
          try {
            if("msgId" in query) {
              query.msgId = parseInt(query.msgId);
            }
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).updateOne(query, {$set : toChange}, {upsert : true}, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    resolve("");
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  deleteOneFromCollection : function(query, collection) {
      return new Promise((resolve, reject) => {
          try {
            console.log("deleteOneFromCollection -> " + collection);
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).deleteOne(query, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    console.log("deleted " + result.deletedCount + " from " + collection);
                    resolve(result);
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  deleteManyFromCollection : function(query, collection) {
      return new Promise((resolve, reject) => {
          try {
            console.log("deleteOneFromCollection -> " + collection);
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).deleteMany(query, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    console.log("deleted " + result.deletedCount + " from " + collection);
                    resolve(result);
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  writeToErrorMessagesCollection : async function(query) {
      return new Promise(async function(resolve, reject) {
        await module.exports.insertToDB(query, consts.errorMessagesCollection, true);
        resolve("");
      });
  },

  findFromCollection : function(query, collection) {
      return new Promise((resolve, reject) => {
          try {
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).find(query).toArray(function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    resolve(result);
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  findWithSortFromCollection : function(query, sortQuery, collection) {
      return new Promise((resolve, reject) => {
          try {
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).find(query).sort(sortQuery).toArray(function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    resolve(result);
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },

  findOneFromCollection : function(query, collection) {
      return new Promise((resolve, reject) => {
          try {
            functions.dbConnect().then((conn)=>{
                conn.database.collection(collection).findOne(query, function(err, result) {
                    if(err) { reject(err); }
                    conn.db.close();
                    resolve(result);
                });
            });
          } catch(e) {
            console.log(e);
          }
      });
  },
  // TelematicsDb functions
  updateCollectionWithUpsertTelematicsDb: function(condition, values, collection) {
    return new Promise((resolve, reject) => {
      try {
        functions.telematicsDbConnect().then((conn) => {
	  conn.database.collection(collection).updateOne(condition, {$set: values}, {upsert : true}, function(err, result) {
	    if (err) {
	      reject(err);
	    }
	    conn.db.close();
	    resolve("OK");
	  });
	});
      } catch(e) {
        console.log(e);
      }
    });
	}
};
