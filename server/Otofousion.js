const axios = require('axios');

const URL_OTOFUSION_JS_SERVER = 'https://api.otofusion.com/cgi-bin/l3HAkE1z2o8E/push.cgi';
const HTTP_POST_TOKEN_OTOFUSION = 'ncr2b4S9YNb7q';

const HTTP_POST_PARAMETER_TOKEN_NAME_MESSAGE = "token"; 
const HTTP_POST_PARAMETER_TYPE_NAME_MESSAGE = "type"; 
const HTTP_POST_PARAMETER_DATA_NAME_MESSAGE = "data"; 

let TAG = "Otofusion.js sendAxios ";
async function sendAxios(json_data, msg_type) {
  
  try {
    console.log(`sendAxios, msgType: ${msg_type} json_data: ${json_data}`);
    
    const url = URL_OTOFUSION_JS_SERVER;
    const data = {
      [HTTP_POST_PARAMETER_TOKEN_NAME_MESSAGE]: HTTP_POST_TOKEN_OTOFUSION,
      [HTTP_POST_PARAMETER_TYPE_NAME_MESSAGE]: msg_type,
      [HTTP_POST_PARAMETER_DATA_NAME_MESSAGE]: json_data,
    };

    console.log(TAG + "checkpoint --1--");
    const response = await axios.post(url, data);
    const responseJson = JSON.stringify(response);
    console.log(TAG + "checkpoint --2--");
    console.log(TAG + typeof response)
    // console.log(TAG + "checkpoint --3--");
    console.log(TAG + response +"response")
    // console.log(TAG + "checkpoint --4--");
    // Handle successful response
    // volleyCallBack.onSuccess(response.data);
    // processNextRequest(context);
  } catch (error) {
    console.log("checkpoint ---error---"+ error)
    // Handle error
    // volleyCallBack.onFailure(error);
    // processNextRequest(context);
  }
}

// Usage example:
const yourJsonData = '{"key": "value"}'; // Replace with your JSON data
const yourMsgType = 'yourMessageType'; // Replace with your message type
const yourContext = {}; // Replace with your context
const yourVolleyCallBack = {
  onSuccess: (response) => {
    console.log('Request successful:', response);
  },
  onFailure: (error) => {
    console.error('Request failed:', error);
  },
};

sendAxios(yourJsonData, yourMsgType, yourContext, yourVolleyCallBack);
module.exports={sendAxios}