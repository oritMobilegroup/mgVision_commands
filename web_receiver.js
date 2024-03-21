//jshint esversion: 9
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const consts = require('./consts');
const mongo_service = require('./mongo_service');
const jimp = require('jimp');
const jimp_resize = require('jimp');
const fs = require('fs');
const iridium_web_message = require('./iridium_web_message');
const send_message_obj = require('./send_message');
const sbd_queue_per_imei_manager = require("./sbd_queue_per_imei_manager");
app.use(express.static(__dirname));
// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

/////////////////////////// Encryption Tests //////////////////////////////////////////////////////////////////////////
app.post('/' + consts.server_folder + "/sendEncryption", function(request, response) {
  console.log("POST TO EncryptionTest");
  console.log(request.body.format);
  console.log("base64 length = " + request.body.encryptedText.length);
  const crypto = require('crypto');
  const ivLength = 16;
  const algorithm = 'aes-128-ctr';
  var key = "3e$C!F)H@McQfTjK";
  if("encryptedText" in request.body && "format" in request.body && (request.body.format == "image" || request.body.format == "text" || request.body.format == "audio")) {
      //from base64 to byteArray
      var data = request.body.encryptedText;
      while(data.indexOf(" ") > -1)
      {
        data = data.replace(" ", "+");
      }
      let decodedAsBase64Value = Buffer.from(data, 'base64');
      console.log("encrypted length = " + decodedAsBase64Value.length);
      let decodedAsBase64Key = Buffer.from(key);
      //get IV from message
      let ivArr = decodedAsBase64Value.slice(0, ivLength);
      //get crypted message from second part of message
      let cipherTextArr = decodedAsBase64Value.slice(ivLength, decodedAsBase64Value.length);
      let cipher = crypto.createDecipheriv(algorithm, decodedAsBase64Key, ivArr);
      //decrypted value
      let decrypted = cipher.update(cipherTextArr, 'binary');
      if(request.body.format == "text") {
        // decrypted += cipher.final();
        console.log(decrypted);
        tempval = decrypted;
      } else if(request.body.format == "image") {
        console.log("decrypted size = " + decrypted.length);
        fs.writeFile(consts.local_server_path + "encrypted.jpg", Buffer.from(decrypted), function (err) {
          if (err) throw err;
          console.log('encrypted.jpg Saved! ' + Date.now());
        });
      } else if(request.body.format == "audio") {
        console.log("decrypted size = " + decrypted.length);
        fs.writeFile(consts.local_server_path + "example.mp3", Buffer.from(decrypted), function (err) {
          if (err) throw err;
          console.log('example.mp3 Saved! ' + Date.now());
        });
      }
      response.send({status: "ok"});
  } else {
      console.log("format not text/image/audio");
      response.send({status: "error", reason: "encryptedText/key missing"});
  }
});

var tempval = "";

app.post('/' + consts.server_folder + "/receiveEncryption", function(request, response) {
  console.log("POST to receiveEncryption");
  console.log(request.body);
  var key = "3e$C!F)H@McQfTjK";
  const crypto = require('crypto');
  const algorithm = 'aes-128-ctr';
  var iv = crypto.randomBytes(16);
  var cipher = crypto.createCipheriv(algorithm, new Buffer(key), iv);
  var encrypted;
  if(request.body.format == "text") {
    encrypted = cipher.update(tempval);
  } else if(request.body.format == "image"){
    encrypted = cipher.update(fs.readFileSync(consts.local_server_path + "encrypted.jpg"));
  } else if(request.body.format == "audio") {
    encrypted = cipher.update(fs.readFileSync(consts.local_server_path + "example.mp3"));
  }
  encrypted = Buffer.concat([iv,encrypted]);
  response.send({status: "ok", message: encrypted.toString('base64')});
});


///////////////////////////Mobile Group website //////////////////////////////////////////////////////////////////////////
const url_mgsatellite = '/MGsatellite';
app.route(url_mgsatellite)
// show mobilegroup website service.
.get(function(request, response) {
    console.log("MGsatellite GET request");
    response.render('satellite_site');
});

const url_register_user = '/MGsatellite/registerNewSatteliteUser';
app.route(url_register_user)
.get(function(req, res) {
    res.render('register_new_sattelite_user');
})
.post(function(req, res) {
    console.log("post to " + url_register_user);
    console.log(req.body);
    var collection = consts.admin_satellite_users_collection;
    consts.db_connect().then((conn) => {
        conn.database.collection(collection).findOne({username : req.body.username, password : req.body.password}, function(err, result){
            if(err) {
              console.log(err);
              res.render("result",{msg : consts.reason_general_error});}
            conn.db.close();
            if(!result) {
                console.log(consts.response_invalid_params);
                res.render("result", {msg : consts.response_invalid_params});
            } else if("timestamp" in  result && (Date.now() - result.timestamp) > consts.timestamp_one_hour) {
                console.log(req.body.username + ": " + consts.response_password_expired);
                res.render("result", {msg : req.body.username + ": " + consts.response_password_expired});
            } else {
                if(!consts.validateEmail(req.body.email)) {
                    console.log(consts.reason_email_address);
                    res.render("result", {msg : consts.reason_email_address});
                } else if(!check_imei_validity(req.body.imei)) {
                    console.log(consts.response_imei_not_valid);
                    res.render("result", {msg : consts.response_imei_not_valid});
                } else {
                    consts.db_connect().then((conn) => {
                        conn.database.collection(consts.users_collection).findOne({imei : req.body.imei}, function(err, result) {
                            if(err) {
                              console.log(err);
                              res.render("result",{msg : consts.reason_general_error});}
                            conn.db.close();
                            if(result) {
                                console.log(consts.reason_user_already_exist);
                                res.render("result", {msg : consts.reason_user_already_exist});
                            } else {
                                console.log("checking if there are paired phones available");
                                consts.db_connect().then((conn) => {
                                    conn.database.collection(consts.phones_collection).findOneAndUpdate({used : false},{$set:{used : true}}).then((result) => {
                                        conn.db.close();
                                        if(result.value) {
                                            console.log("result from phones collection");
                                            console.log(result.value);
                                            console.log("inserting new user to users collection");
                                            mongo_service.insert_to_mongo({
                                                imei : req.body.imei,
                                                mac : req.body.mac,
                                                name : req.body.name,
                                                email : req.body.email,
                                                phone_number : req.body.phoneNumber,
                                                max_messages_per_image : consts.default_chunks_per_image,
                                                sos_phone_contact : consts.default_settings,
                                                sos_email_contact : consts.default_settings,
                                                phone : result.value.phone,
                                                SerialKey : consts.secretKeyGenerator(),
                                                timestamp_registered : Date.now(),
                                                msgId : 0
                                            }, consts.users_collection);
                                            res.render("result", {msg:"User " + req.body.name + " : " + req.body.imei + " has been inserted with paired phone " + result.value.phone});
                                        } else {
                                            console.log(consts.response_no_paired_phones_available);
                                            res.render("result",{msg : consts.response_no_paired_phones_available});
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            }
        });
    });
});

const url_remove_user = '/MGsatellite/removeSatteliteUser';
app.route(url_remove_user)
.get(function(req, res) {
    res.render('remove_new_sattelite_user');
})
.post(function(req, res) {
    console.log("post to " + url_remove_user);
    console.log(req.body);
    var collection = consts.admin_satellite_users_collection;
    consts.db_connect().then((conn) => {
        conn.database.collection(collection).findOne({username : req.body.username, password : req.body.password}, function(err, result){
            if(err) {
              console.log(err);
              res.render("result",{msg : consts.reason_general_error});
            }
            conn.db.close();
            if(!result) {
                console.log(consts.response_invalid_params);
                res.render("result", {msg : consts.response_invalid_params});
            } else if("timestamp" in  result && (Date.now() - result.timestamp) > consts.timestamp_one_hour) {
                console.log(req.body.username + ": " + consts.response_password_expired);
                res.render("result", {msg : req.body.username + ": " + consts.response_password_expired});
            } else {
                consts.db_connect().then((conn) => {
                    conn.database.collection(consts.users_collection).findOne({imei : req.body.imei, name : req.body.name, phone : req.body.pairedPhone}, function(err, result) {
                        if(err) {
                          console.log(err);
                          res.render("result",{msg : consts.reason_general_error});
                        }
                        conn.db.close();
                        if(!result) {
                            console.log(consts.response_sattelite_user_doesnt_exist);
                            res.render("result", {msg : consts.response_sattelite_user_doesnt_exist});
                        } else {
                            console.log("removing user");
                            mongo_service.mongo_deleteOne_from_collection({imei : req.body.imei, name : req.body.name, phone : req.body.pairedPhone}, consts.users_collection);
                            mongo_service.updateOne_mongo_collection({phone: req.body.pairedPhone},{used : false}, consts.phones_collection);
                            res.render("result", {msg:"User " + req.body.name + " : " + req.body.imei + " has been removed and paired phone " + req.body.pairedPhone + " is now available again"});
                        }
                    });
                });
            }
        });
    });
});

const url_get_user_details = '/MGsatellite/getSatteliteUserDetails';
app.route(url_get_user_details)
.get(function(req, res) {
    res.render('get_sattelite_user_details');
})
.post(function(req, res) {
    console.log("post to " + url_get_user_details);
    console.log(req.body);
    var collection = consts.admin_satellite_users_collection;
    consts.db_connect().then((conn) => {
        conn.database.collection(collection).findOne({username : req.body.username, password : req.body.password}, function(err, result){
            if(err) {
              console.log(err);
              res.render("result",{msg : consts.reason_general_error});}
            conn.db.close();
            if(!result) {
                console.log(consts.response_invalid_params);
                res.render("result", {msg : consts.response_invalid_params});
            } else if("timestamp" in  result && (Date.now() - result.timestamp) > consts.timestamp_one_hour) {
                console.log(req.body.username + ": " + consts.response_password_expired);
                res.render("result", {msg : req.body.username + ": " + consts.response_password_expired});
            } else {
                consts.db_connect().then((conn) => {
                    conn.database.collection(consts.users_collection).findOne({imei : req.body.imei}, function(err, result) {
                        if(err) {
                          console.log(err);
                          res.render("result",{msg : consts.reason_general_error});}
                        conn.db.close();
                        if(!result) {
                            console.log(consts.response_sattelite_user_doesnt_exist);
                            res.render("result", {msg : consts.response_sattelite_user_doesnt_exist});
                        } else {
                            console.log(result);
                            var resultStringBuilder = "";
                            for (const [key, value] of Object.entries(result)) {
                              if(key != "_id") {
                                resultStringBuilder += key + " : " + value + " <br>";
                              }
                            }
                            res.render('result', {msg:resultStringBuilder});
                        }
                    });
                });
            }

        });
    });
});


var AWS = consts.get_aws_sdk();
// create new password and send to admin user mail.
app.post('/send_password', function(req, res) {
    const nodemailer = require('nodemailer');
    // var transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: consts.email_user,
    //     pass: consts.email_user_pass
    //   }
    // });
    var transporter = nodemailer.createTransport({
        SES: new AWS.SES({
            apiVersion: '2010-12-01'
        })
    });
    console.log("post to /send_password");
    console.log(req.body);
    var new_pwd = consts.password_maker();
    console.log("create pass: " + new_pwd);
    var collection = consts.admin_satellite_users_collection;
    consts.db_connect().then((conn) => {
        conn.database.collection(collection).findOneAndUpdate({username : req.body.username},{$set:{password : new_pwd, timestamp : Date.now()}}).then((result) => {
              conn.db.close();
              if(result.value) {
                  console.log(result);
                  var mailOptions = {
                    from: consts.email_user,
                    to: result.value.email,
                    subject: 'New Password MobileGroupSatellite',
                    text: 'username: ' + req.body.username + '\nPassword: ' + new_pwd
                  };
                  transporter.sendMail(mailOptions, function(error, info){
                      if (error) {
                        res.sendStatus(500);
                      } else {
                        console.log(consts.response_new_pass_sent);
                        res.send(consts.response_new_pass_sent);
                      }
                  });
              } else {
                  res.send(consts.response_admin_user_not_exist);
                  console.log(consts.response_admin_user_not_exist);
              }
        });
    });
});

///////////////////////////Mobile Group post requests from clients //////////////////////////////////////////////////////////////////////////
//get_utils
app.post('/' + consts.server_folder + "/get_utils", function(request, response) {
  if("currentVersion" in request.body && "imei") {
      consts.db_connect().then((conn) => {
          conn.database.collection(consts.users_collection).findOne({imei: request.body.imei}, function(err, res) {
              if(err) {res.sendStatus(500);}
              conn.db.close();
              if(res) {
                  consts.db_connect().then((conn) => {
                      conn.database.collection(consts.users_collection).updateOne({imei: request.body.imei},{$set:{version : request.body.currentVersion}},function(err, result) {
                          if(err) {res.sendStatus(500);}
                          conn.db.close();
                      });
                  });
                  let file = fs.readFileSync('sbdConfig.json');
                  let configJson = JSON.parse(file);
                  response.send(configJson);
              } else {
                response.send({status : consts.status_error, reason: consts.reason_imei_not_signed});
              }
          });
      });
  } else {
      response.send({status: consts.status_error, reason: consts.reason_missing_params});
  }
});

//get secret encryption key
app.post('/' + consts.server_folder + "/getSerialKey", function(request, response) {
  console.log("POST to getSerialKey");
  console.log(request.body);
  if("imei" in request.body && "mac" in request.body) {
    consts.db_connect().then((conn) => {
        conn.database.collection(consts.users_collection).findOne({imei: request.body.imei, mac : request.body.mac}, function(err, result) {
            if(err) {res.sendStatus(500);}
            conn.db.close();
            if(result && "SerialKey" in result) {
              response.send({status: consts.status_ok, SerialKey: result.SerialKey});
            } else if(result) {
              result.SerialKey = consts.secretKeyGenerator();
              response.send({status: consts.status_ok, SerialKey: result.SerialKey});
              mongo_service.updateOne_mongo_collection({imei: request.body.imei, mac : request.body.mac}, result, consts.users_collection);
            } else {
              response.send({status : consts.status_error, reason: consts.reason_imei_not_signed});
            }
        });
    });
  } else {
    response.send({status: consts.status_error, reason: consts.reason_missing_params});
  }
});

//getLocationpPost Rafael
app.post('/' + consts.server_folder + "/getLocationsForImeis", function(request, response) {
  // console.log("getLocationsForImeis POST");
  // console.log(request.body);
  var imeis = "imeis";
  if(!(imeis in request.body)) {
    response.send({status:consts.status_error, reason:"no imei list sent in post request"});
    return;
  }
  request.body.imeis = request.body.imeis.replace(/\s/g, '');
  var imeisList = request.body.imeis.split(",");
  consts.db_connect().then((conn) => {
      conn.database.collection(consts.imei_locations_collection).find({imei:{$in:imeisList}, read : false}).toArray(function(err, locationsArray) {
            if(err) {response.sendStatus(500);}
            else {
              conn.db.close();
              locationsArray.forEach(element => {
                element.lat = element.latitude;
                element.lng = element.longitude;
              });
              response.send({status:consts.status_ok, locations : locationsArray});
              consts.db_connect().then((conn) => {
                  conn.database.collection(consts.imei_locations_collection).updateMany({imei:{$in:imeisList}, read : false}, {$set:{read:true}},function(err, locationsArray) {
                        if(err) {response.sendStatus(500);}
                        conn.db.close();

                  });
              });
            }


      });
  });
});


//uploadLocation
app.post('/' + consts.server_folder + "/uploadLocation", function(request, response) {
  var imeis = "imei";
  if(!(imeis in request.body)) {
    response.send({status:consts.status_error, reason :"imei missing in request"});
    return;
  }
  if("timestamp" in request.body) {
    request.body.timestamp = parseInt(request.body.timestamp);
    request.body.time = consts.unixTime(request.body.timestamp);
  }
  request.body.read = false;
  request.body.source = "internet";
  response.send({status:consts.status_ok});
  mongo_service.insertLocation(request.body, true);
});

app.post('/' + consts.server_folder + "/uploadLocations", function(request, response) {
  var imeis = "imei";
  consts.db_connect().then((conn) => {
      conn.database.collection(consts.users_collection).findOne({imei: request.body.imei}, function(err, result) {
          if(err) {res.sendStatus(500);}
          conn.db.close();
          if(result) {
            var locations = JSON.parse(request.body.locations);
            for(var i = 0; i < locations.length; i++) {
              locations[i].source = "internet";
              locations[i].imei = request.body.imei;
              locations[i].time = consts.unixTime(locations[i].timestamp);
              locations[i].read = false;
              if(i == locations.length - 1) {
                mongo_service.insertLocation(locations[i], true);
              } else {
                mongo_service.insertLocation(locations[i], false);
              }
            }
            response.send({status:consts.status_ok});
          } else {
            response.send({status:consts.status_error, reason :"imei/MAC not valid"});
          }
      });
  });
});

// get details of user
app.post('/' + consts.server_folder + "/get_user_details", function(request, response) {
    console.log("get_user_details POST request");
    console.log(request.body);
    if("imei" in request.body && "mac" in request.body) {
      var collection = consts.users_collection;
      consts.db_connect().then((conn) => {
          conn.database.collection(collection).find({imei : request.body.imei, mac : request.body.mac}).toArray(function(err, result) {
                conn.db.close();
                if(err) {response.send({status : consts.status_error, reason: consts.reason_ineternal_error});}
                if(result.length == 0) {
                  console.log(consts.reason_imei_not_signed);
                  response.send({status : consts.status_error, reason: consts.reason_imei_not_signed});
                } else {
                  console.log(result[0]);
                  var res = {
                    status : consts.status_ok,
                    name : result[0].name,
                    phone : result[0].phone,
                    phone_number : result[0].phone_number,
                    sos_phone_contact : result[0].sos_phone_contact,
                    sos_email_contact : result[0].sos_email_contact,
                    max_messages_per_image : result[0].max_messages_per_image,
                    email : result[0].email
                  };
                  response.send(res);
                }
          });
      });
    } else {
        response.send({status : consts.status_error, reason: consts.reason_imei_missing});
    }
});

// update details of user
app.post('/' + consts.server_folder + "/update_user_details", function(request, response) {
    console.log("update_user_details POST request");
    console.log(request.body);
    if("imei" in request.body && "mac" in request.body) {
      var collection = consts.users_collection;
      consts.db_connect().then((conn) => {
          conn.database.collection(collection).updateOne({imei : request.body.imei, mac : request.body.mac},  {$set : request.body}, function(err, result) {
                conn.db.close();
                if(err) {response.send({status : consts.status_error, reason: consts.reason_ineternal_error});}
                console.log("user details updated");
                response.send({status : consts.status_ok});
          });
      });
    } else {
        response.send({status : consts.status_error, reason: consts.reason_imei_missing});
    }
});

// web service for post requests from iridium.
app.post('/' + consts.server_folder + "/iridium_web_message", function(request, response) {
    console.log("iridium_web_message POST");
    if("sender_imei" in request.body && "mac" in request.body) {
      consts.db_connect().then((conn) => {
          conn.database.collection(consts.users_collection).findOne({imei : request.body.sender_imei, mac : request.body.mac}, function(err, result) {
                conn.db.close();
                if(err) {response.send({status : consts.status_error, reason: consts.reason_ineternal_error});}
                if(result) {
                    request.body.network = consts.network_type_internet;
                    if("type" in request.body && request.body.type == consts.type_sos) { //sos
                        console.log("iridium_web_message type sos");
                        iridium_web_message.handle_post_request_sos(request.body, response);
                    } else if("type" in request.body){ // iridium / whatsapp / email
                        iridium_web_message.handle_post_request_regular(request.body, response);
                    }
                } else {
                    response.send({status : consts.status_error, reason: consts.reason_imei_not_signed});
                }
          });
      });
    } else {
      response.send({status : consts.status_error, reason: consts.reason_missing_params});
    }
});

app.post('/' + consts.server_folder + "/client_messages_requests", function(request, response) {
    if("imei" in request.body && "mac" in request.body) {
        consts.db_connect().then((conn) => {
            conn.database.collection(consts.users_collection).findOne({imei : request.body.imei, mac : request.body.mac}, function(err, result) {
                  conn.db.close();
                  if(err) {response.send({status : consts.status_error, reason: consts.reason_ineternal_error});}
                  if(result) {
                      var collection = consts.messages_collection;
                      consts.db_connect().then((conn) => {
                          conn.database.collection(collection).find({target_address : request.body.imei, status : consts.status_ready}).toArray(function(err, result) {
                                conn.db.close();
                                if(result.length > 0) {
                                    sbd_queue_per_imei_manager.clean_waiting_queue_for_imei(request.body.imei);
                                    console.log(result.length + " messages for " + request.body.imei);
                                    var counter = 1;
                                    result.forEach((message) => {
                                        console.log("message no." + counter + ". sender: " + message.sender_imei + " , type: " + message.type + " , format: " + message.format);
                                        counter++;
                                    });
                                    // result.map(msg => console.log(msg));
                                    response.send({number_of_messages : result.length, messages : result});
                                    consts.db_connect().then((conn) => {
                                        conn.database.collection(collection).updateMany({target_address : request.body.imei, status : consts.status_ready, $or:[{format:consts.format_jpg},{format:consts.format_audio}]}, {$set:{status: consts.status_sent, network : consts.network_type_internet, msg_content:""}}, function(err, result) {
                                              conn.db.close();
                                              consts.db_connect().then((conn) => {
                                                  conn.database.collection(collection).updateMany({target_address : request.body.imei, status : consts.status_ready}, {$set:{status: consts.status_sent, network : consts.network_type_internet}}, function(err, result) {
                                                        conn.db.close();
                                                        console.log("messages sent for " + request.body.imei);
                                                  });
                                              });
                                        });
                                    });

                                } else {
                                    //console.log("no messages for " + request.body.imei);
                                    response.send({number_of_messages : 0});
                                }
                          });
                      });
                  } else {
                      response.send({status : consts.status_error, reason: consts.reason_imei_not_signed});
                  }
            });
        });
    } else {
        response.send({status : consts.status_error, reason: consts.response_missing_imei_param});
    }
});


// // upload profile images
// app.post('/' + consts.server_folder + "/upload_profile_image", function(request, response) {
//     console.log("upload_profile_image POST" + request.body.imei);
//     if(request.body.profileImage == "") { // empty profile image
//         consts.db_connect().then((conn)=>{
//             var collection = consts.users_collection;
//             conn.database.collection(collection).updateOne({imei : request.body.imei}, {$set : {"profileImage" : ""}}, function(err, result) {
//                 if(err) {
//                   console.log(err);
//                   response.send({status: consts.status_error});
//                 }
//                 else {
//                   console.log("remove profile image saved for " + request.body.imei);
//                   response.send({status: consts.status_ok});
//                 }
//             });
//             conn.db.close();
//         });
//     } else { // uploaded a profile image
//       var image_file_name = consts.profile_images_folder + "/" + request.body.imei + ".jpg";
//       save_profile_image(image_file_name, request.body.profileImage);
//       // consts.write_file(image_file_name, Buffer.from(request.body.profileImage));
//       consts.db_connect().then((conn)=>{
//           var collection = consts.users_collection;
//           conn.database.collection(collection).updateOne({imei : request.body.imei}, {$set : {"profileImage" : image_file_name}}, function(err, result) {
//               if(err) {
//                 response.send({status: consts.status_error});
//                 console.log(err);
//               }
//               else {
//                 console.log("upload profile image saved for " + request.body.imei);
//                 response.send({status: consts.status_ok});
//               }
//           });
//           conn.db.close();
//       });
//     }
// });

function save_profile_image(filename, data) {
  var fs = require('fs');
  data = data.replace(/^data:image\/\w+;base64,/, "");
  var buf = Buffer.from(data, "base64");
  fs.writeFile(filename, buf, function (err) {
    if (err) throw err;
    console.log(filename + ' has been Saved!');
  });
}

///////////////////////////receiving Email messages and sending to iridium //////////////////////////////////////////////////////////////////////////
app.get('/reply/:id', function(req, res) {
    console.log("mail reply GET request");
    // console.log(req.body);
    console.log("id = " + req.params.id);
    consts.db_connect().then((conn) => {
        conn.database.collection(consts.mail_reply_ids_collection).findOne({id : req.params.id}, function(err, result) {
            if(err) {res.sendStatus(500);}
            conn.db.close();
            if(result) {
              console.log(result);
              consts.db_connect().then((conn) => {
                  conn.database.collection(consts.users_collection).findOne({imei : result.imei}, function(err, user) {
                        if(err) {res.sendStatus(500);}
                        conn.db.close();
                        if(user && "name" in user) {
                            console.log("reply to " + user.name);
                            console.log(result.id);
                            res.render('satellite_site_sendReply', {name : user.name, id : result.id});
                        } else {
                            var id = req.params.id;
                            console.log(id + " " + consts.response_url_used);
                            res.render("satellite_site_errorpage",{msg : "User doesn't exist"});
                        }
                  });
              });
            } else{
              console.log(req.body.imei + " " + consts.response_url_used);
              res.render("satellite_site_errorpage",{msg : consts.response_url_used});
            }
        });
    });
});

app.post("/send_mail_reply", function(req, res) {
    console.log("send_mail_reply POST request");
    // console.log(req.body);
    if("id" in req.body && ("replyText" in req.body || "replyImage" in req.body)) {
      data = {status:consts.status_waiting, type : consts.type_email, timestamp : Date.now(), time : consts.get_current_time(), date : consts.get_date()};
      consts.MongoClient.connect(consts.db_url, consts.warning_fix ,function(err, db) {
        if (err) throw err;
        var dbo = db.db(consts.database);
        dbo.collection(consts.mail_reply_ids_collection).findOne({id:req.body.id}, function(err, result) {
            if (err) throw err;
            if(result && "imei" in result && "email" in result) {
              data.sender_imei = result.email;
              data.target_address = result.imei;
              if("replyText" in req.body) {
                  data.format = consts.format_text;
                  data.msg_content = new TextEncoder("utf-8").encode(req.body.replyText);
              } else { // "replyImage" in req.body
                  req.body.replyImage = req.body.replyImage.replace(/^data:image\/\w+;base64,/, "");
                  data.format = consts.format_jpg;
                  var content = req.body.replyImage.replace(/^data:image\/\w+;base64,/, ""); // the image url.
                  content = Buffer.from(content, "base64");
                  data.msg_content = consts.images_folder + "email" + data.timestamp + "-" + data.sender_imei + "_original.jpg"; //filename of image.
                  fs.writeFile(data.msg_content, content, function (err) {
                    if (err) throw err;
                    console.log(data.msg_content + ' Saved! ' + Date.now());
                  });
              }
              get_mailID_and_send(data, req.body.id, res);
            } else {
                res.render("satellite_site_errorpage",{msg : consts.response_try_again_later});
            }
        });
      });
    } else {
      res.render("satellite_site_errorpage",{msg : consts.response_try_again_later});
    }
});

function get_mailID_and_send(data, reply_id, res) {
  console.log("in get_id_mail");
  var id = 0;
  consts.MongoClient.connect(consts.db_url,consts.warning_fix ,function(err, db) {
      if (err) throw err;
      var dbo = db.db(consts.database);
      var collection = consts.email_senders_collection;
      dbo.collection(collection).findOne({email : data.sender_imei}, function(err, user) {
          if (err) throw err;
          console.log(user);
          db.close();
          if(!user) {
              mongo_service.insert_to_mongo({email : data.sender_imei, msg_id : 1}, collection);
          } else {
              if(consts.msg_id in user) {
                  var next_id = user.msg_id + 1;
                  mongo_service.updateOne_mongo_collection({email : data.sender_imei}, {msg_id : next_id}, collection);
              } else {
                  mongo_service.updateOne_mongo_collection({email : data.sender_imei}, {msg_id : 1}, collection);
              }
          }
          consts.MongoClient.connect(consts.db_url,consts.warning_fix ,function(err, db) {
            if (err) throw err;
            var dbo = db.db(consts.database);
            dbo.collection(consts.users_collection).findOne({imei : data.target_address}, function(err, user) {
                if (err) throw err;
                console.log(user);
                db.close();
                if(user && 'max_messages_per_image' in user) {
                  var max_messages_per_image = user.max_messages_per_image;
                  if(consts.msg_id in user) {
                      console.log("msg_id exist in user " + data.target_address);
                      data.msg_id = user.msg_id + 1;
                      if(data.msg_id == 256) {data.msg_id = 0;}
                  } else {
                      console.log("msg_id doesn't exist in user " + data.target_address);
                      data.msg_id = 0;
                  }
                  mongo_service.updateOne_mongo_collection({imei : data.target_address}, {msg_id : data.msg_id}, consts.users_collection);
                  if(data.format == consts.format_text) {
                      console.log("email upload format TEXT");
                      send_text_to_satellite(data);
                      reduce_remaining_in_mail_reply_id_collection(reply_id, res);
                      res.render("satellite_site_mailReplySent");
                  } else { //format is jpg
                      console.log("email upload format JPG");
                      reduce_remaining_in_mail_reply_id_collection(reply_id, res);
                      send_image_to_satellite(data, max_messages_per_image, {}, data.msg_content);
                      res.render("satellite_site_mailReplySent");
                  }
                } else {
                  console.log("user doesnt exist " + data.target_address);
                  res.render("satellite_site_errorpage",{msg : consts.response_try_again_later});
                }
            });
          });

      });
  });
}

function reduce_remaining_in_mail_reply_id_collection(reply_id, res) {
  consts.db_connect().then((conn)=>{
      var collection = consts.mail_reply_ids_collection;
      conn.database.collection(collection).findOne({id : reply_id}, function(err, result) {
          if(err) {
            res.render("satellite_site_errorpage",{msg : consts.response_try_again_later});
            console.log(err);
          }
          conn.db.close();
          if(result) {
            if(result.remaining > 1) {
              var new_remaining = result.remaining - 1;
              mongo_service.updateOne_mongo_collection({id : reply_id},{remaining:new_remaining}, consts.mail_reply_ids_collection);
            } else {
              mongo_service.mongo_deleteOne_from_collection({id : reply_id}, consts.mail_reply_ids_collection);
            }

          } else {
            res.render("satellite_site_errorpage",{msg : consts.response_try_again_later});
          }
      });
  });
}

///////////////////////////receiving SMS messages and sending to iridium //////////////////////////////////////////////////////////////////////////

app.post('/' + consts.server_folder + "/SMS", function(request, response) {
  console.log('POST from SMS to iridium');
  console.log(request.body);
  if(request.body.SmsStatus == 'received' && 'To' in request.body && 'Body' in request.body && 'From' in request.body) {
      parse_and_send_SMS(request.body, response);
  } else {
      console.log("response to SMS: " + consts.reason_general_error);
      send_response(consts.reason_general_error, response);
  }
});

function parse_and_send_SMS(request, response) {
    try {
        console.log("in parse_SMS_message");
        var data = {status : consts.type_sms, format : consts.format_text, type : consts.type_sms, timestamp : Date.now(), time : consts.get_current_time(), date : consts.get_date()};
        data.sender_imei = request.From;
        data.target_address = request.To;
        data.msg_content = new TextEncoder("utf-8").encode(request.Body);
        get_SMS_id_and_send(data, response);
    } catch(e) {
        console.log("response to SMS: " + e);
        mongo_service.mongo_write_error_message({
        status : consts.status_error, body : request, format : consts.format_text, type : consts.type_sms, reason:e}, consts.get_date(), consts.get_current_time());
        send_response(consts.reason_general_error, response);
    }
}

function get_imei_of_phone_and_sendSMS(data, response) {
    console.log("in get_imei_of_phone_and_sendSMS");
    consts.MongoClient.connect(consts.db_url,consts.warning_fix ,function(err, db) {
        if (err) throw err;
        var dbo = db.db(consts.database);
        var collection = consts.users_collection;
        dbo.collection(collection).findOne({phone : data.target_address}, function(err, user) {
            if (err) throw err;
            console.log(user);
            db.close();
            if(user && "imei" in user) {
                data.target_address = user.imei;
                if(consts.msg_id in user) {
                    console.log("msg_id exist in user " + data.target_address);
                    data.msg_id = user.msg_id + 1;
                    if(data.msg_id == 256) {data.msg_id = 0;}
                } else {
                    console.log("msg_id doesn't exist in user " + data.target_address);
                    data.msg_id = 0;
                }
                mongo_service.updateOne_mongo_collection({imei : data.target_address}, {msg_id : data.msg_id}, collection);
                console.log("going to send SMS");
                // send_response(consts.text_message_delivered_from_whatsapp, response);
                response.status(200).send("<?xml version='1.0' encoding='UTF-8'?><Response></Response>");
                send_text_to_satellite(data);
            } else {
                console.log("response to sms sender: " + consts.response_no_user_for_phone);
                send_response(consts.response_no_user_for_phone, response);
            }
        });
      });
}

function get_SMS_id_and_send(data, response) {
  console.log("in get_SMS_id_and_send");
  var id = 0;
  consts.MongoClient.connect(consts.db_url,consts.warning_fix ,function(err, db) {
      if (err) throw err;
      var dbo = db.db(consts.database);
      var collection = consts.sms_senders_collection;
      dbo.collection(collection).findOne({phone : data.sender_imei}, function(err, user) {
          if (err) throw err;
          db.close();
          if(!user) {
            console.log("sms sender doesn't exist - adding him to sms senders");
            mongo_service.insert_to_mongo({phone : data.sender_imei, msg_id : 1}, collection);
          } else {
            console.log("sms sender exist");
            if(consts.msg_id in user) {
                id = user.msg_id + 1;
                mongo_service.updateOne_mongo_collection({phone : data.sender_imei}, {msg_id : id}, collection);
            }
            console.log(user);
          }
          get_imei_of_phone_and_sendSMS(data, response);
      });
    });
}

///////////////////////////receiving whatsapp messages and sending to iridium //////////////////////////////////////////////////////////////////////////

// web service to receive whatsapp messages to iridium.
var whatsapp_media_confirmations = ["yes", "y", "[yes]", "yess"];
function whatsapp_media_confirmation_check(request, body, response) {
    body = body.toLowerCase();
    if(whatsapp_media_confirmations.indexOf(body) > -1) {
      consts.db_connect().then((conn)=>{
          var collection = consts.users_collection;
          conn.database.collection(collection).findOne({phone : request.body.To.split(":")[1]}, function(err, result) {
              conn.db.close();
              if(err) {
                console.log(err);
                response.send(consts.response_inner_problem);
              }
              if(result && "imei" in result) {
                  var imei = result.imei;
                  consts.db_connect().then((conn)=>{
                      var collection = consts.waiting_whatsapp_media_collection;
                      console.log("from " + request.body.From.split(":")[0]);
                      conn.database.collection(collection).find({sender_imei : imei, target_address : request.body.From.split(":")[1]}).toArray(function(err, result) {
                          conn.db.close();
                          if(err) {
                            console.log(err);
                            response.send(consts.response_inner_problem);
                          }
                          if(result.length > 0) {
                              console.log("whatsapp_media_confirmations result is true, sending " + result.length + " media files to whatsapp user");
                              for(var i = 0; i < result.length; i++) {
                                  console.log("going to send media from satellite to whatsapp user");
                                  mongo_service.mongo_deleteOne_from_collection({sender_imei : result[i].sender_imei, msg_id: result[i].msg_id, timestamp:result[i].timestamp}, consts.waiting_whatsapp_media_collection);
                                  result[i].timestamp = Date.now();
                                  result[i].date = consts.get_date();
                                  result[i].time = consts.get_current_time();
                                  var filename = "";
                                  if(result[i].format == consts.format_audio) {
                                    filename = consts.buildAudioFilenameFromSatellite(result[i]);
                                  } else {
                                    //format jpg
                                    filename = mongo_service.build_jpg_file(result[i]);
                                  }
                                  const send_message_obj = require('./send_message');
                                  if(i==0) {response.status(200).end();}
                                  send_message_obj.send_whatsapp_message(result[i], filename, consts.single_message, {});
                              }
                          } else {
                              console.log("whatsapp_image_confirmation result is false handling whatsapp to satellite message");
                              update_sender_count_and_start_handle(request, response);
                          }
                      });

                  });
              } else {
                console.log("no imei paired for " + request.body.To);
                response.send(consts.response_phone_has_no_imei);
              }
          });

      });
    } else {
        console.log("whatsapp_image_confirmation result is false handling whatsapp to satellite message");
        update_sender_count_and_start_handle(request, response);
    }
}
app.post('/' + consts.server_folder, function(request, response) {
  console.log('POST from whatsapp to iridium');
  console.log(request.body);
  if(request.body.SmsStatus == 'received') {
      whatsapp_media_confirmation_check(request, request.body.Body, response);
  } else {
      console.log("response to whatsapp: " + consts.reason_general_error);
      send_response(consts.reason_general_error, response);
  }

});

app.listen(4050, function(){
  console.log("Web listener server listens on port 4050");
});

function update_sender_count_and_start_handle(request, response) {
  console.log("in update_sender_count_and_start_handle");
  var id = 0;
  consts.MongoClient.connect(consts.db_url,consts.warning_fix ,function(err, db) {
      if (err) throw err;
      var dbo = db.db(consts.database);
      var splitted_from = request.body.From.split(":");
      var sender = splitted_from[1];
      var collection = consts.whatsapp_senders_collection;
      dbo.collection(collection).findOne({phone : sender}, function(err, result) {
          if (err) throw err;
          console.log(result);
          db.close();
          if(!result) {
            if(request.body.Body.length > 0 && ("MediaContentType0" in request.body)) {
              mongo_service.insert_to_mongo({phone : sender, msg_id : 2}, collection);
            } else {
              mongo_service.insert_to_mongo({phone : sender, msg_id : 1}, collection);
            }
          } else {
              if(consts.msg_id in result) {
                  var id = result.msg_id;
                  if(request.body.Body.length > 0 && ("MediaContentType0" in request.body)) { // text and image messages
                    id += 2;
                  } else {
                    id++;
                  }
                  mongo_service.updateOne_mongo_collection({phone : sender}, {msg_id : id}, collection);
              } else {
                  if(request.body.Body.length > 0 && ("MediaContentType0" in request.body)) { // text and image messages
                    mongo_service.updateOne_mongo_collection({phone : sender}, {msg_id : 2}, collection);
                  } else {
                    mongo_service.updateOne_mongo_collection({phone : sender}, {msg_id : 1}, collection);
                  }
              }
          }
          get_address_and_start_handle(request, response);
      });
  });
}

function get_address_and_start_handle(request, response) {
    console.log("in get_address_and_start_handle");
    consts.MongoClient.connect(consts.db_url,consts.warning_fix ,function(err, db) {
        if (err) throw err;
        var dbo = db.db(consts.database);
        var splitted_to = request.body.To.split(":");
        var receiver = splitted_to[1];
        var collection = consts.users_collection;
        dbo.collection(collection).findOne({phone : receiver}, function(err, result) {
          try {
              if (err) throw err;
              console.log(result);
              db.close();
              if(!result || !("imei" in result)) {
                  throw receiver + " " + consts.reason_no_imei_to_phone;
              } else {
                  var id = 1;
                  if(consts.msg_id in result) {
                      var random = parseInt(Math.random() * 10) + 2;
                      if(request.body.Body.length > 0 && ("MediaContentType0" in request.body)) { // text and image messages
                        id = result.msg_id + random;
                        if(id >= 256) {id = 1;}
                      } else {
                        id = result.msg_id + random;
                        if(id >= 256) {id = 0;}
                      }
                  } else {
                      if(request.body.Body.length > 0 && ("MediaContentType0" in request.body)) { // text and image messages
                        id = 1;
                      } else {
                        id = 0;
                      }
                  }
                  mongo_service.updateOne_mongo_collection({imei:result.imei},{msg_id : id},  consts.users_collection);
                  handle_correct_message(request, id, result.imei, response, parseInt(result.max_messages_per_image));
              }
            } catch(e) {
                console.log("get_address_and_start_handle Exception: " + e);
                var data1 = {status : consts.status_error, reason : e};
                data1.type = consts.type_whatsapp;
                data1.body = request.body;
                mongo_service.mongo_write_error_message(data1, consts.get_date(), consts.get_current_time());
                console.log("response to whatsapp: " + e);
                send_response(e, response);
            }
        });
    });
}
function handle_correct_message(request, id, address, response, max_messages_per_image) {
  try {
      var image_and_text =  false; //if message 0 send response and if not so response already sent.
      console.log("in handle_correct_message");
      var data = {status : consts.status_ready, status_chunks : consts.status_waiting, msg_id : parseInt(id), target_address : address};
      var splitted_from = request.body.From.split(":");
      data.sender_imei = splitted_from[1];
      data.timestamp = Date.now();
      data.senderTimestamp = data.timestamp;
      data.date = consts.get_date();
      data.time = consts.get_current_time();
      data.type = consts.type_whatsapp;
      var find_query = {sender_imei : data.sender_imei,  status_chunks : consts.status_waiting};
      if("MediaContentType0" in request.body) { //image/audio whatsapp
          if(request.body.MediaContentType0.includes("image")) { // image
            find_query.msg_id = parseInt(data.msg_id);
            if(request.body.Body.length > 0) { // this means text message is added with the image. call this function again to send seperate text message from image message.
                image_and_text = true;
                var text_msg = {};
                text_msg.body = {};
                text_msg.body.Body = request.body.Body;
                text_msg.body.From = request.body.From;
                text_msg.body.To = request.body.To;
                var res = handle_correct_message(text_msg, id - 1, data.target_address,null, max_messages_per_image);
            }
            var image_url = request.body.MediaUrl0;
            data.format = consts.format_jpg;
            send_image_to_satellite(data, max_messages_per_image, find_query, image_url);
          } else if(request.body.MediaContentType0.includes("audio")) { // audio
            handleWhatsappVoice(data, request.body.MediaUrl0, response);
          }
      } else { // text whatsapp
          find_query.msg_id = data.msg_id;
          find_query.msg_id = parseInt(data.msg_id);
          console.log("whatsapp text message and imei valid");
          data.format = consts.format_text;
          var full_message = new TextEncoder("utf-8").encode(request.body.Body);
          data.msg_content = full_message;
          send_text_to_satellite(data);
      }
      console.log("image_and_text= " + image_and_text);
      if(image_and_text && response != null) {
          console.log("response to whatsapp: " + consts.image_and_text_message_delivered_from_whatsapp);
          send_response(consts.image_and_text_message_delivered_from_whatsapp, response);
      } else if(data.format == consts.format_jpg && response != null) {
          console.log("response to whatsapp: " + consts.image_message_delivered_from_whatsapp);
          send_response(consts.image_message_delivered_from_whatsapp, response);
      } else if(data.format == consts.format_text && response != null) {
          console.log("response to whatsapp: " + consts.text_message_delivered_from_whatsapp);
          send_response(consts.text_message_delivered_from_whatsapp, response);
      }
  } catch(e) {
      console.log("handle_correct_message Exception: " + e);
      var data1 = {status : consts.status_error, reason : e.toString()};
      data1.type = consts.type_whatsapp;
      data1.body = request.body;
      mongo_service.mongo_write_error_message(data1, consts.get_date(), consts.get_current_time());
      console.log("response to whatsapp: " + consts.reason_general_error);
      send_response(consts.reason_general_error, response);
  }

}

function handleWhatsappVoice(data, voiceUrl, response) {
  console.log("in handleWhatsappVoice() from " + data.sender_imei + " to " + data.target_address + " msg_id: " + data.msg_id);
  data.format = consts.format_audio;
  var filename = consts.audio_dir_full_path + consts.buildVoiceFileName(data.sender_imei, data.target_address, data.msg_id, data.timestamp);
  var compressedFileName = consts.audio_dir_full_path + consts.buildCompressedVoiceFileName(data.sender_imei, data.target_address, data.msg_id, data.timestamp);
  fs.writeFile(filename, "", function (err) {
      if (err) throw err;
      var req = require('request');

      req.get(voiceUrl)
        .on('error', function(err) {
          console.log(err);
        })
        .on('end' , function() {
              console.log("in req on.end");
              fs.open(filename, 'r', function(status, fd) { //read original file bytes to msg content array
                  if (status) {
                      console.log(status.message);
                      return;
                  }
                  var buffer = Buffer.alloc(fs.statSync(filename).size);
                  fs.read(fd, buffer, 0, fs.statSync(filename).size, 0, function(err, num) {
                      data.msg_content = [...buffer.toJSON().data];
                      console.log("msg_content length - " + data.msg_content.length);
                      const { getAudioDurationInSeconds } = require('get-audio-duration');

                      getAudioDurationInSeconds(filename).then((duration) => {
                        console.log("duration = " + duration + " seconds from " + data.sender_imei + " to " + data.target_address + " msg_id: " + data.msg_id);
                        data.audioDuration = parseInt(duration) + 1;
                        if(duration > 10) {
                          console.log("response to whatsapp: " + consts.response_audio_duration_problem);
                          send_response(consts.response_audio_duration_problem, response);
                        } else {
                          console.log("response to whatsapp: " + consts.audio_delivered_from_whatsapp);
                          send_response(consts.audio_delivered_from_whatsapp, response);
                          const { exec } = require("child_process");
                          exec("ffmpeg -i " + filename + "  -b:a 8k -codec:a  libopus -ar 8k -ac 1  " + compressedFileName, (error, stdout, stderr) => {
                              if (error) {
                                  console.log(`child_process error: ${error.message}`);
                                  return;
                              }

                              console.log(compressedFileName + " saved!");
                              module.exports.buildVoiceSBDAndSendAudio(data, compressedFileName);
                          });
                        }

                      });
                  });
              });

          })
        .pipe(fs.createWriteStream(filename));
  });
}

module.exports.buildVoiceSBDAndSendAudio = function(data, compressedFileName) {
  console.log("in buildVoiceSBDAndSendAudio() from " + data.sender_imei + " to " + data.target_address + " msg_id: " + data.msg_id);
  var sendLocation = false;
  if("send_location" in data && data.send_location) {
    sendLocation = true;
  }
  var readStream = fs.createReadStream(compressedFileName, { highWaterMark : 10000 });
  var chunks = [];
  var byteArray = [];
  data.payload_length = 0;
  readStream.on('data', function(chunk) {
      chunk = consts.uint8ArrayToArray(Uint8Array.from(chunk));
      byteArray = byteArray.concat(chunk);
      // data.msg_content += chunk;
  }).on('end', function() {
      // data.msg_content = Buffer.from(data.msg_content).toJSON().data;
      var j = 0, i = 0, chunk = [], currentChunkSize = 0;
      while(i < byteArray.length) {
          if(i == 0) {
            currentChunkSize = consts.chunk_size - consts.first_chunk_header_size - 1 - data.sender_imei.length; // the last -1 is for audio duration.
            if(sendLocation) {currentChunkSize = currentChunkSize - 8;}
          } else {
            currentChunkSize = consts.chunk_size - consts.added_chunk_header_size;
          }
          chunk = [];
          for(j = i; j < i + currentChunkSize; j++) {
            if(j > byteArray.length) {
              break;
            }
            chunk.push(byteArray[j]);
          }
          chunks.push(chunk);
          i = j;
      }
      data.number_of_chunks = chunks.length;
      for(var index = 0; index < chunks.length; index++) {
          if(index == (chunks.length - 1)) {
              data.status_chunks = consts.status_sent;
          }
          data.current_chunk = index;
          if(index == 0) {
              var filename1 = consts.bulidSBDFileName(data.sender_imei, data.target_address, data.msg_id, 0);
              var firstChunk = [];
              firstChunk.push(data.audioDuration);
              for(j = 0; j < chunks[0].length; j++) {
                firstChunk.push(chunks[0][j]);
              }
              var payload;
              if(sendLocation) {
                payload = iridium_web_message.build_first_chunk_payload(data.sender_imei, firstChunk, consts.format_audio, data.type, data.msg_id, chunks.length, sendLocation, data.timestamp, data.latitude, data.longitude);
              } else {
                payload = iridium_web_message.build_first_chunk_payload(data.sender_imei, firstChunk, consts.format_audio, data.type, data.msg_id, chunks.length, sendLocation, data.timestamp, null, null);
              }
              data.payload_length += payload.length;
              data.payloads = [];
              data.payloads.push(consts.local_server_path + consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename1);
              consts.write_file(consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename1, Buffer.from(payload));
          } else {
              var filename2 = consts.bulidSBDFileName(data.sender_imei, data.target_address, data.msg_id, index);
              var payload1 = iridium_web_message.build_added_chunk_payload(index, chunks[index], data.msg_id);
              data.payload_length += payload1.length;
              data.payloads.push(consts.local_server_path + consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename2);
              consts.write_file(consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename2, Buffer.from(payload1));
          }
        }
        console.log("number of chunks created for image - " + data.payloads.length);
        data.status = consts.status_ready;
        mongo_service.insert_to_mongo(data, consts.messages_collection);
        //check after 22 seconds if message was sent by internet and if not - send it by sbd
        setTimeout(function() {
            var query_ready_message = {timestamp : data.timestamp, sender_imei : data.sender_imei, target_address : data.target_address, format : data.format, type : data.type, msg_id : data.msg_id, status:consts.status_ready};
            consts.db_connect().then((conn) => {
                conn.database.collection(consts.messages_collection).findOne(query_ready_message,function(err, result) {
                    if(err) {res.sendStatus(500);}
                    conn.db.close();
                    if(result) {
                        console.log("did not sent by internet");
                        sbd_queue_per_imei_manager.send_or_add_to_waiting_list(result, query_ready_message);
                    }
                });
            });
        }, consts.timestamp_wait_for_client_internet_request);
    });
};

function send_text_to_satellite(data) {
  console.log("in send_text_to_satellite");
  var chunks = iridium_web_message.build_iridium_chunks(data.msg_content, data.sender_imei.length, false);
  data.payload_length = 0;
  console.log("text number of chunks " + chunks.length);
  data.number_of_chunks = chunks.length;
  for(index = 0; index < chunks.length; index++) {
      if(index == (chunks.length - 1)) {
          data.status_chunks = consts.status_sent;
      }
      data.current_chunk = index;
      if(index == 0) {
          var first_payload = iridium_web_message.build_first_chunk_payload(data.sender_imei, chunks[index], consts.format_text, data.type, data.msg_id, data.number_of_chunks, false, data.timestamp, null, null);
          data.payloads = [];
          data.payload_length += first_payload.length;
          var filename3 = consts.bulidSBDFileName(data.sender_imei, data.target_address, data.msg_id, 0);
          data.payloads.push(consts.local_server_path + consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename3);
          consts.write_file(consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename3, Buffer.from(first_payload));
      } else {
          var filename4 = consts.bulidSBDFileName(data.sender_imei, data.target_address, data.msg_id, index);
          var added_payload = iridium_web_message.build_added_chunk_payload(index, chunks[index], data.msg_id);
          data.payload_length += added_payload.length;
          data.payloads.push(consts.local_server_path + consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename4);
          consts.write_file(consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename4, Buffer.from(added_payload));
      }
  }
  data = consts.fix_msg_content_to_array(data);
  data.status = consts.status_ready;
  mongo_service.insert_to_mongo(data, consts.messages_collection);
  //check after 22 seconds if message was sent by internet and if not - send it by sbd
  setTimeout(function() {
      var query_ready_message = {timestamp : data.timestamp, sender_imei : data.sender_imei, target_address : data.target_address, format : data.format, type : data.type, msg_id : data.msg_id, status:consts.status_ready};
      consts.db_connect().then((conn) => {
          conn.database.collection(consts.messages_collection).findOne(query_ready_message,function(err, result) {
              if(err) {res.sendStatus(500);}
              conn.db.close();
              if(result) {
                  console.log("did not sent by internet");
                  sbd_queue_per_imei_manager.send_or_add_to_waiting_list(result, query_ready_message);
              }
          });
      });
  }, consts.timestamp_wait_for_client_internet_request);
}

function send_image_to_satellite(data, max_messages_per_image, find_query, image_url) {
    var image_path = "", image_path_full_quality = "";
    if(data.type == consts.type_whatsapp) {
        image_path = consts.images_folder + "whatsapp" + data.timestamp + "-" + data.sender_imei + ".jpg";
        image_path_full_quality = consts.images_folder + "whatsapp" + data.timestamp + "-" + data.sender_imei + "_original.jpg";
    } else if(data.type == consts.type_email) {
        image_path = consts.images_folder + "email" + data.timestamp + "-" + data.sender_imei + ".jpg";
        image_path_full_quality = consts.images_folder + "email" + data.timestamp + "-" + data.sender_imei + "_original.jpg";
    }
    console.log("reading image with jimp");
    try {
      jimp.read(image_url, (err, img) => {
          if (err) {
            console.log("download_plus_shrink function - jimp throws error");
            throw err;
          }
          console.log("img.bitmap.data.toJSON().data.length = " + img.bitmap.data.toJSON().data.length);

          img.resize(0.85 * img.bitmap.width, 0.85 * img.bitmap.height) // resize
          .quality(100); // set JPEG quality
          while(img.bitmap.data.toJSON().data.length > 2100000) {
            console.log("img.bitmap.data.toJSON().data.length = " + img.bitmap.data.toJSON().data.length);
            img.resize(0.85 * img.bitmap.width, 0.85 * img.bitmap.height) // resize
            .quality(100); // set JPEG quality
          }
          img.write(image_path_full_quality);
          console.log("img.bitmap.data.toJSON().data.length = " + img.bitmap.data.toJSON().data.length);
          fs.open(image_path_full_quality, 'r', function(status, fd) { //read original file bytes to msg content array
              if (status) {
                  console.log(status.message);
                  return;
              }
              var buffer = Buffer.alloc(fs.statSync(image_path_full_quality).size);
              fs.read(fd, buffer, 0, fs.statSync(image_path_full_quality).size, 0, function(err, num) {
                  data.msg_content = [...buffer.toJSON().data];
                  console.log("msg_content length - " + data.msg_content.length);
              });
          });
          module.exports.number_of_resizes = 0;
          module.exports.image_resize_and_send(img, image_path, 100, img.bitmap.width, img.bitmap.height, max_messages_per_image, image_url, data, find_query, image_path_full_quality);
      });
    } catch(e) {
      console.log("jimp exception");
      console.log(e);
    }

}

module.exports.number_of_resizes = 0;
const max_number_of_resizes = 100;
const min_size_image = 50;
const min_quality_image = 25;
function calc_image_resize(quality, width, height, size_diff) {
  console.log("size_diff= " + size_diff);
  height = parseInt(parseFloat(height) * 0.7);
  width = parseInt(parseFloat(width) * 0.7);
  quality = quality - 6;
  if(quality < min_quality_image) {quality = min_quality_image;}
  if(height < min_size_image) {height = min_size_image;}
  if(width < min_size_image) {width = min_size_image;}
  return {height: height, width:width, quality:quality};
}

module.exports.image_resize_and_send = function(img, image_path, quality, width, height, max_messages_per_image, image_url, data, find_query, image_path_full_quality) {
    if(module.exports.number_of_resizes > max_number_of_resizes) {
        console.log("number_of_resizes is bigger than max_number_of_resizes" + module.exports.number_of_resizes);
        img.resize(min_size_image, min_size_image) // resize
        .quality(min_quality_image) // set JPEG quality
        .write(image_path); // save image in path.
        image_build_and_send(image_url, image_path, data, find_query);
    }
    console.log("image width = " + width + "  image height = " + height + "   quality= " + quality);
    img.resize(width, height) // resize
    .quality(quality) // set JPEG quality
    .write(image_path); // save image in path.
    setTimeout(function(){
      jimp_resize.read(image_path, (err, image) => {
          if (err) throw err;
        //  var sizeInBytes = image.bitmap.data.length;
          var sizeInBytes = fs.statSync(image_path).size;
          console.log(image_path + " image size= " + sizeInBytes);
          var dimensions = {};
          if(module.exports.number_of_resizes > 0) {
              var size_diff = parseInt(sizeInBytes / consts.chunk_size) - max_messages_per_image;
              dimensions = calc_image_resize(quality, width, height, size_diff);
          } else {
              dimensions = {height: height, width:width, quality:quality};
          }
          console.log("number_of_resizes= " + module.exports.number_of_resizes);
          module.exports.number_of_resizes++;
          image_resizing_to_max_messages(image, image_path, dimensions.quality, dimensions.width, dimensions.height, max_messages_per_image, sizeInBytes, image_url, data, find_query, image_path_full_quality);
      });
    }, 700);
  };

function image_resizing_to_max_messages(image, image_path, quality, width, height, max_messages_per_image, sizeInBytes, image_url, data, find_query, image_path_full_quality) {
    var added = 0;
    if(parseInt(sizeInBytes % consts.chunk_size) > 0) {added = 1;}
    console.log("sizeInBytes/chunk size + added= " + (parseInt(sizeInBytes / consts.chunk_size) + added));
    if(parseInt(sizeInBytes / consts.chunk_size) + added > max_messages_per_image) {
        console.log("resizing image");
        module.exports.image_resize_and_send(image, image_path, quality, width, height, max_messages_per_image, image_url, data, find_query, image_path_full_quality);
    } else {
        if((parseInt(sizeInBytes / consts.chunk_size) + added <= max_messages_per_image)) {
            console.log("number of chunks is less or equal to " + max_messages_per_image);
            image_build_and_send(image_url, image_path, data, find_query, image_path_full_quality);
        } else {
            console.log("number of chunks is more than " + max_messages_per_image);
        }
    }
}

function image_build_and_send(image_url, image_path, data, find_query, image_path_full_quality) {
    console.log(image_url + '.jpg Image Downloaded to images folder');
    var sendLocation = false;
    if("send_location" in data && data.send_location) {
      sendLocation = true;
    }
    var readStream = fs.createReadStream(image_path, { highWaterMark : 10000 });
    var i = 0;
    var chunks = [];
    var byteArray = [];
    data.payload_length = 0;
    readStream.on('data', function(chunk) {
          chunk = consts.uint8ArrayToArray(Uint8Array.from(chunk));
          byteArray = byteArray.concat(chunk);
           // data.msg_content += chunk;
    }).on('end', function() {
      console.log(byteArray);
        // data.msg_content = Buffer.from(data.msg_content).toJSON().data;
        var j = 0, i = 0, chunk = [], currentChunkSize = 0;
        while(i < byteArray.length) {
            if(i == 0) {
              currentChunkSize = consts.chunk_size - consts.first_chunk_header_size - data.sender_imei.length;
              if(sendLocation) {currentChunkSize = currentChunkSize - 8;}
            } else {
              currentChunkSize = consts.chunk_size - consts.added_chunk_header_size;
            }
            chunk = [];
            for(j = i; j < i + currentChunkSize; j++) {
              if(j > byteArray.length) {
                break;
              }
              chunk.push(byteArray[j]);
            }
            chunks.push(chunk);
            i = j;
        }
        data.number_of_chunks = chunks.length;
        for(var index = 0; index < chunks.length; index++) {
            if(index == (chunks.length - 1)) {
                data.status_chunks = consts.status_sent;
            }
            data.current_chunk = index;
            if(index == 0) {
                var filename1 = consts.bulidSBDFileName(data.sender_imei, data.target_address, data.msg_id, 0);
                var payload;
                if(sendLocation) {
                  payload = iridium_web_message.build_first_chunk_payload(data.sender_imei, chunks[0], consts.format_jpg, data.type, data.msg_id, chunks.length, sendLocation, data.timestamp, data.latitude, data.longitude);
                } else {
                  payload = iridium_web_message.build_first_chunk_payload(data.sender_imei, chunks[0], consts.format_jpg, data.type, data.msg_id, chunks.length, sendLocation, data.timestamp, null, null);
                }
                data.payload_length += payload.length;
                data.payloads = [];
                data.payloads.push(consts.local_server_path + consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename1);
                consts.write_file(consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename1, Buffer.from(payload));
            } else {
                var filename2 = consts.bulidSBDFileName(data.sender_imei, data.target_address, data.msg_id, index);
                var payload1 = iridium_web_message.build_added_chunk_payload(index, chunks[index], data.msg_id);
                data.payload_length += payload1.length;
                data.payloads.push(consts.local_server_path + consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename2);
                consts.write_file(consts.iridium_messages_folder + "/" + data.timestamp + "/" + filename2, Buffer.from(payload1));
            }
        }
        console.log("number of chunks created for image - " + data.payloads.length);
        data.status = consts.status_ready;
        mongo_service.insert_to_mongo(data, consts.messages_collection);
        //check after 22 seconds if message was sent by internet and if not - send it by sbd
        setTimeout(function() {
            var query_ready_message = {timestamp : data.timestamp, sender_imei : data.sender_imei, target_address : data.target_address, format : data.format, type : data.type, msg_id : data.msg_id, status:consts.status_ready};
            consts.db_connect().then((conn) => {
                conn.database.collection(consts.messages_collection).findOne(query_ready_message,function(err, result) {
                    if(err) {res.sendStatus(500);}
                    conn.db.close();
                    if(result) {
                        console.log("did not sent by internet");
                        sbd_queue_per_imei_manager.send_or_add_to_waiting_list(result, query_ready_message);
                    }
                });
            });
        }, consts.timestamp_wait_for_client_internet_request);
    });
}

function check_imei_validity(imei) {
    var i = 0;
    for(i = 0; i < imei.length; i++) {
        switch(imei[i]) {
            case "0": case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
              continue;
            default:
              return false;
        }
    }
    return true;
}

function send_response(msg, response) {
  response.status(200).send("<?xml version='1.0' encoding='UTF-8'?><Response><Message>" + msg + "</Message></Response>");

}
