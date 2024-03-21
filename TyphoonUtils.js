//jshint esversion: 9
var Long = require('mongodb').Long;
const consts = require('../constants/consts');
const functions = require('../constants/functions');
const converter = require('json-2-csv');
const util = require('util');
const nodemailer = require('nodemailer');
var mongoose = require('mongoose');
InsertImuItem

const MongoClient = require('mongodb').MongoClient;

module.exports = {

	InsertImuItem: function(imuItem, addTimeStampToReal) {
        return new Promise((resolve, reject) => {
            try {

	        //console.log('insertIntoDB -> ' + "IMU");
	        var imu = {acc: imuItem.acc, timeStamp: imuItem.timeStamp, timeStampReal: addTimeStampToReal};
                functions.typhoonDbConnect().then((conn) => {
                    conn.database.collection('IMU').insertOne(imu, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                             // console.log('inserted into IMU');
                            //console.log(result.ops);
                        } else {
                           // console.log('not inserted into IMU');
//                          console.log("imu::::::: " + imu);
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
                //console.log("not inserted into IMU" + e);
            }
        });
    },


    InsertImuList: function(imuList) {
        return new Promise((resolve, reject) => {
            try {

	       // console.log('insertIntoDB -> ' + "IMU");
                functions.typhoonDbConnect().then((conn) => {
                    conn.database.collection('IMU').insertMany(imuList, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                          //    console.log('inserted into IMU');
                          //    console.log(result.ops);
                        } else {
                          // console.log('not inserted into IMU');
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
               // console.log("not inserted into IMU" + e);
            }
        });
    },

    InsertSoundItem: function(soundItem, addTimeStampToReal, k) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "SOUND");
	   var sound = {sample: soundItem.sample, timeStamp: soundItem.timeStamp, timeStampReal: addTimeStampToReal};

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('SOUND').insertOne(sound, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                           // console.log('inserted into SOUND['+ k + '] = ' + soundItem.sample.amplitude);
                           // console.log(result.ops);
                           //console.log("sound: " + sound);
                        } else {
                           // console.log('not inserted into SOUND['+ k + '] = ' + soundItem.sample.amplitude);
    //                        console.log("sound: " + sound);
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
              //  console.log("not inserted into SOUND" + e);
            }
        });
    },

    InsertSoundList: function(soundList) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "SOUND");

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('SOUND').insertMany(soundList, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                           // console.log('inserted into SOUND');
                           // console.log(result.ops);
                        } else {
                           // console.log('not inserted into SOUND');
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
               // console.log("not inserted into SOUND" + e);
            }
        });
    },

    InsertSoundMeterList: function(soundMeterList) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "SOUNDMETER");

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('SOUNDMETER').insertMany(soundMeterList, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                           // console.log('inserted into SOUNDMETER');
                           // console.log(result.ops);
                        } else {
                           // console.log('not inserted into SOUNDMETER');
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
               // console.log("not inserted into SOUNDMETER" + e);
            }
        });
    },

    InsertDBShootingsList: function(DBShootings) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "DB_Shootings");

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('DB_Shootings').insertMany(DBShootings, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                           // console.log('inserted into DB_Shootings');
                           // console.log(result.ops);
                        } else {
                           // console.log('not inserted into DB_Shootings');
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
               // console.log("not inserted into DB_Shootings" + e);
            }
        });
    },

    InsertIMU_ShootingsList: function(IMUShootings) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "IMU_Shootings");

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('IMU_Shootings').insertMany(IMUShootings, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                           // console.log('inserted into IMU_Shootings');
                           // console.log(result.ops);
                        } else {
                           // console.log('not inserted into IMU_Shootings');
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
               // console.log("not inserted into IMU_Shootings" + e);
            }
        });
    },



    InsertDccItem: function(dccItem, addTimeStampToReal) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "DCC");
	   var dcc = {current: dccItem.current, timeStamp: dccItem.timeStamp, timeStampReal: addTimeStampToReal};

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('DCC').insertOne(dcc, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                            //console.log('inserted into DCC');
                            //console.log(result.ops);
                        } else {
                            //console.log('not inserted into DCC');
                            //console.log(dcc);
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
                //console.log(e);
            }
        });
    },

        InsertDccList: function(dccList) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "DCC");

                functions.typhoonDbConnect().then((conn) => {
                    conn.database.collection('DCC').insertMany(dccList, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                            //console.log('inserted into DCC');
                            //console.log(result.ops);
                        } else {
                            //console.log('not inserted into DCC');
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
                //console.log(e);
            }
        });
    },


   InsertDcvItem: function(dcvItem, addTimeStampToReal) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "DCV");
	   var dcv = {voltage: dcvItem.voltage, timeStamp: dcvItem.timeStamp, timeStampReal: addTimeStampToReal};

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('DCV').insertOne(dcv , function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                            //console.log('inserted into DCV');
                            //console.log(result.ops);
                        } else {
                            //console.log('not inserted into DCV');
                            //console.log(dcv);
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
                //console.log(e);
            }
        });
    },


    InsertDcvList: function(dcvList) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('insertIntoDB -> ' + "DCV");

                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection('DCV').insertMany(dcvList, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        if (result != null) {
                            //console.log('inserted into DCV');
                            //console.log(result.ops);
                        } else {
                            //console.log('not inserted into DCV');
                            //console.log(dcv);
                        }
                        resolve('success');
                    });
                });
            } catch (e) {
                //console.log(e);
            }
        });
    },


   getTyphoonData: function(collectionName) {
        return new Promise((resolve, reject) => {
            try {
               //console.log('getTyphoonData-> ' + collectionName);
                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection(collectionName).find({}).sort({timeStampReal: 1}).toArray((err, data) => {
                                if (err) {
                                   // console.log(err);
                                    reject(err);
                                }
				if (data != null) {
				  resolve(data);                                
				} else {
				  resolve("No Data");
				}
                            });

                });
            } catch (e) {
                //console.log(e);
            }
        });
    },

   getTyphoonDataByTimeStamp: function(collectionName, timeStampStart, timeStampEnd) {
        return new Promise((resolve, reject) => {
            try {
               console.log('getTyphoonData-> ' + collectionName);
	      var query = {timeStampReal: { $gte : Long.fromString(timeStampStart), $lte : Long.fromString(timeStampEnd)}};
                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection(collectionName).find(query).sort({timeStampReal: 1}).toArray((err, data) => {
                                if (err) {
                                    //console.log(err);
                                    reject(err);
                                }
			if (data != null) {
				resolve(data);                                
			} else {
				resolve("No Data");
			}
                            });

                });
            } catch (e) {
                //console.log(e);
            }
        });
    },


   getLastTyphoonDataByTimeStamp: function(collectionName, timeStamp) {
        return new Promise((resolve, reject) => {
            try {
               console.log('getTyphoonData-> ' + collectionName);
	      var query = {timeStampReal: { $lte : Long.fromString(timeStamp)}};
                functions.typhoonDbConnect().then((conn) => {
                    //console.log('in then()');
                    conn.database.collection(collectionName).find(query).sort({timeStampReal: 1}).limit(5).toArray((err, data) => {
                                if (err) {
                                    //console.log(err);
                                    reject(err);
                                }
			if (data != null) {
				resolve(data);                                
			} else {
				resolve("No Data");
			}
                            });

                });
            } catch (e) {
                //console.log(e);
            }
        });
    },

 
   deleteThypoonData: function(collectionName) {
        return new Promise((resolve, reject) => {
            try {
               
	   //console.log('deleteThypoonData-> ' + collectionName);

                functions.typhoonDbConnect().then((conn) => {
                   // console.log('in then()');
                    conn.database.collection(collectionName).deleteMany({}, function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        conn.db.close();
                        resolve('success');
                    });
                });
            } catch (e) {
                //console.log(e);
            }
        });
    },



};
