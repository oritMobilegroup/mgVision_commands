//jshint esversion: 8
const TAG = "sendSMS.js: ";
const consts = require('../constants/consts');

module.exports.sendSMS = function(message, receiver) {
  var FuncTag = TAG + "sendSMS: ";
  console.log(FuncTag + "sending sms to " + receiver);
  var accountSid = consts.accountSid;
  var authToken = consts.authToken;
  var client = require('twilio')(accountSid, authToken);
  client.messages
  .create({
     body: message,
     from: "+16467148329",
     to: receiver
   })
  .then(message => {
    console.log(FuncTag + "messageSid = " + message.sid);
    console.log(FuncTag + "Message sent: " + message);
  }).catch(error => {
    console.log(error);
  });
};
