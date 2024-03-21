//jshint esversion: 9
var Long = require('mongodb').Long;
// const consts = require('../constants/consts');
// const functions = require('../../constants/functions');
// const converter = require('json-2-csv');
// const util = require('util');
// const nodemailer = require('nodemailer');
// var mongoose = require('mongoose');
const mongodb =require("./mongodb-connection")
const {typhoonDbConnect}= require("./mongodb-connection")

const MongoClient = require('mongodb').MongoClient;
module.exports = {
   
        InsertImuItem: function(imei) {
            return new Promise((resolve, reject) => {
                try {
                    var imu = {
                        Imei: imei.Imei,
                        Message: imei.Message,
                        App: imei.App,
                        Date: imei.Date,
                        Timestemp: imei.Timestemp
                    };
    
                    typhoonDbConnect().then((db) => {
                        const collection = db.collection('IMU'); // Access the collection from the 'db' object
    
                        // Define the filter based on the 'imei' value
                        var filter = { Imei: imu.Imei };
    
                        // Use 'updateOne' with 'upsert' option
                        collection.updateOne(
                            filter, // Filter to find the existing document
                            { $set: imu }, // Set the new values
                            { upsert: true }, // Upsert option to insert if not found
                            function(err, result) {
                                if (err) {
                                    reject(err);
                                }
                                if (result != null) {
                                    resolve(imu);
                                } else {
                                    reject(new Error('Failed to upsert document'));
                                }
                            }
                        );
                    });
    
                } catch (e) {
                    reject(e);
                }
            });
        }};
   
    
    


//     InsertImuItem: function(imei) {
//         return new Promise((resolve, reject) => {
//             try {

// 	        //console.log('insertIntoDB -> ' + "IMU");
// 	        var imu = {Imei:imei. Imei, Message: imei.Message, App: imei.App, Date: imei.Date,Timestemp:imei.Timestemp};
      
//                 functions.typhoonDbConnect().then((conn) => {
//                     conn.database.collection('IMU').insertOne(imu, function(err, result) {
//                         if (err) {
//                             reject(err);
//                         }
//                         conn.db.close();
//                         if (result != null) {
//                              // console.log('inserted into IMU');
//                             //console.log(result.ops);
//                         } else {
//                            // console.log('not inserted into IMU');
// //                          console.log("imu::::::: " + imu);
//                         }
//                         resolve(imu);
//                     });
//                 });
//             } catch (e) {
//                 //console.log("not inserted into IMU" + e);
//             }
//         });
//     },

