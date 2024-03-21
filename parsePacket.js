//jshint esversion: 8
const TAG = "parsePacket.js: ";
const functions = require("../constants/functions");
const consts = require("../constants/consts");
const crcItuCheck = require("./crcItuCheck");
const carLocatorMongo = require("./carLocatorMongo");
const carLocatorConsts = require("./carLocatorConsts");
const GmtDateConverter = require("./GmtDateConverter");
const FireBaseNotifications = require("./FireBaseNotifications");
const admin = require("firebase-admin");
var serviceAccount = require("./firebase_key.json");
const { sendDataTestOtofusionURL } = require("./SERVER/TestOtofusion.js");
const { sendAxios } = require("./SERVER/Otofousion");
const PREV_ACC_FILE_PATH = './rowIdTracker.json';

var counter = 0;
const IDENTITY_BYTE = 0x7e;// in decimal is  126 
let prevACC = {};
const imeiLocationMap = {};
const imeiTimeMap = {};

let rowIdTracker = {};
let rowIdTracker_ACC_ON = {};
let rowIdTracker_ACC_OFF = {};

let rowIdTracker_Shock = {};
let rowIdTracker_Power_Cut = {};

const lastSendTimes = {};
let rowIdTrackers = {};

function savePrevACC() {
  const data = JSON.stringify(prevACC, null, 2);
  fs.writeFile(PREV_ACC_FILE_PATH, data, 'utf8', (err) => {
    if (err) {
      console.error("Failed to save prevACC data:", err);
    } else {
      console.log("prevACC data saved successfully.");
    }
  });}

const WORD_LEN_BYTES = 2;

const PACKET_IDENTIFICATION_START_INDEX = 0;

//bytes that we need to escape
//According to this rule:
// 0x7e ??0x7d followed by 0x02;
// 0x7d ??0x7d followed by 0x01
const ESCAPED_BYTES = [0x7e, 0x7d];
const ESCAPED_BYTES_TO_BE_EXPANDED_TO = [[0x7d, 0x02], [0x7d, 0x01]];

const CHECKSUM_INDEX_FROM_THE_END = 0;//When counting from the end.
const CHECKSUM_LEN = 1;//one byte.



const MESSAGE_ID_START_INDEX = 0;
const MESSAGE_ID_PROPERTIES_LEN = 2;
const MESSAGE_ID_END_INDEX = MESSAGE_ID_START_INDEX + (MESSAGE_ID_PROPERTIES_LEN - 1);


const MessageID_ERROR = "MessageID_ERROR";
const MessageID_types = {
  Terminal_register_response: 0x0001,
  Platform_Common_Answer: 0x8001,
  Terminal_Heartbeat: 0x0002,
  Terminal_Register: 0x0100,
  Terminal_Registration_Reply: 0x8100,
  Terminal_Authentication: 0x0102,
  Set_Terminal_Parameters: 0x8103,
  Query_Terminal_Parameters: 0x8104,
  Query_terminal_parameter_response: 0x0104,
  Terminal_Control: 0x8105,
  Location_information_report: 0x0200,
  Location_Message_Query: 0x8201,
  Location_message_query_response: 0x0201,
  Artificial_confirm_alert_message: 0x8203,
  Text_Message_issued: 0x8300,
  vehicle_control: 0x8500,
  vehicle_control_response: 0x0500,
  Set_Polygon_Area: 0x8604,
  Delete_polygon_area: 0x8605,
  Set_Routine: 0x8606,
  Delete_Routine: 0x8607,
  Data_downlink_unvarnished_transmission: 0x8900,
  Data_uplink_unvarnished_transmission: 0x0900,
  Bilnd_area_data_upload: 0x0704
};


//Message length:
const MASK_MESSAGE_LENGTH = 0x3FF;
const MASK_ENCRYPTION = 0x1C00;

const MESSAGE_IS_NOT_ENCRYPTED = 0;
const MESSAGE_IS_ENCRYPTED = 2;
//todo check if for the other cases is the message encrypted or not.

//After removing the identity byte at the start and at the end.
//Message body properties:
const MESSAGE_BODY_PROPERTIES_START_INDEX = 2;
const MESSAGE_BODY_PROPERTIES_LEN = 2;
const MESSAGE_BODY_PROPERTIES_END_INDEX = MESSAGE_BODY_PROPERTIES_START_INDEX + (MESSAGE_BODY_PROPERTIES_LEN - 1);

const MESSAGE_ENCRYPTION_INDEX = 11;

//Device ID:
const DEVICE_ID_START_INDEX = 4;
const DEVICE_ID_LEN = 6;
const DEVICE_ID_END_INDEX = DEVICE_ID_START_INDEX + (DEVICE_ID_LEN - 1);

//Message Serial 
const MSG_SERIAL_START_INDEX = 10;
const MSG_SERIAL_LEN = 2;
const MSG_SERIAL_END_INDEX = MSG_SERIAL_START_INDEX + (MSG_SERIAL_LEN - 1);

//Alarm Signs
const ALARM_SIGNS_START_INDEX = 12;
const ALARM_SIGNS_LEN = 4;
const ALARM_SIGNS_END_INDEX = ALARM_SIGNS_START_INDEX + (ALARM_SIGNS_LEN - 1);

//State
const STATE_START_INDEX = 16;
const STATE_LEN = 4;
const STATE_END_INDEX = STATE_START_INDEX + (STATE_LEN - 1);

//Latitude
const LATITUDE_START_INDEX = 20;
const LATITUDE_LEN = 4;
const LATITUDE_END_INDEX = LATITUDE_START_INDEX + (LATITUDE_LEN - 1);

//Longitude
const LONGITUDE_START_INDEX = 24;
const LONGITUDE_LEN = 4;
const LONGITUDE_END_INDEX = LONGITUDE_START_INDEX + (LONGITUDE_LEN - 1);

//HEIGHT
const HEIGHT_START_INDEX = 28;
const HEIGHT_LEN = 2;
const HEIGHT_END_INDEX = HEIGHT_START_INDEX + (HEIGHT_LEN - 1);

//SPEED
const SPEED_START_INDEX = 30;
const SPEED_LEN = 2;
const SPEED_END_INDEX = SPEED_START_INDEX + (SPEED_LEN - 1);

//Direction
const DIRECTION_START_INDEX = 32;
const DIRECTION_LEN = 2;
const DIRECTION_END_INDEX = DIRECTION_START_INDEX + (DIRECTION_LEN - 1);

//Time
const TIME_START_INDEX = 34;
const TIME_LEN = 6;
const TIME_END_INDEX = TIME_START_INDEX + (TIME_LEN - 1);

//Conversion from packet value to real value
const LAT_LONG_UNIT = Math.pow(10, 6);


//helper function:
function print(s) {
  let now = new Date();
  let dateString = now.toLocaleDateString();
  let timeString = now.toLocaleTimeString();
  let TIME_TAG = dateString + ' ' + timeString;

  counter++;
  console.log(TIME_TAG + ", count: " + counter + ": " + s);
}
//Returns true if it's ok.
function check_identify_byte(data_array) {
  let last_element_index = data_array.length - 1;
  //todo : do we need to check if the first bit are identity bit?
  // var ok = (data_array[0] & IDENTITY_BYTE) == IDENTITY_BYTE && (data_array[last_element_index] & IDENTITY_BYTE) == IDENTITY_BYTE; 
  var ok = (data_array[0]) == IDENTITY_BYTE && (data_array[last_element_index] & IDENTITY_BYTE) == IDENTITY_BYTE;
  return ok;
}

function get_device_id(data_array) {
  deviceID_raw_array = data_array.slice(DEVICE_ID_START_INDEX, DEVICE_ID_END_INDEX + 1);
  const arr = deviceID_raw_array;
  const base16string = arr.map(item => item.toString(16));

  var ret = "";
  for (var i = 0; i < base16string.length; i++) {
    ret += base16string[i];
  }

  ret = parseInt(ret);

  return ret;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const packetTypes = {
  login: 1,
  location: 18,
  heartBeat: 19,
  alarm: 22,
  smsCommandResponse: 21,
};


//Terminal Registration Reply : (0x8100) to Terminal Register message ID: 0x0100 which was sent from device.
//This is an example to test.
//Works : we get back 0x0102
function get_service_reply_to_register() {
  var data = new Uint8Array(11);

  //identity bit.
  data[0] = 0x7e;

  //Message Header
  //Message body properties
  //Message id:
  data[1] = 0x81;
  data[2] = 0x00;


  //Message body properties :# bit 0 -> 10 is length in bytes 
  data[3] = 0x0;
  data[4] = 0x4;

  // Answer Serial number 
  data[5] = 0x00;
  data[6] = 0x33;
  // Result 
  data[7] = 0x00;

  // Authentication Code 
  data[8] = 0x01;

  //need to write checksum
  data[9] = 0x32

  //identity bit.
  data[10] = 0x7e;
  return data;
}

//Platform Common Answer: (0x8001) to Terminal Authentication : 0x0102 which was sent from device.
//This is an example to test.
function get_service_reply_to_terminal_authentication() {
  var data = new Uint8Array(11);

  //identity bit.
  data[0] = 0x7e;

  //Message body properties
  //Message id:
  data[1] = 0x80;
  data[2] = 0x01;

  //Message body properties (length is 2 byte which is word) :# bit 0 -> 10 is length in bytes 
  data[3] = 0x0;
  data[4] = 0x4;

  // Answer Serial number 
  data[5] = 0x00;
  data[6] = 0x33;

  // Answer ID 
  data[7] = 0x00;

  // Result
  data[8] = 0x00;

  //need to write checksum
  data[9] = 0xB6;

  //identity bit.
  data[10] = 0x7e;
  return data;
}

//Data is an databuffer without identity bit. 
//Checksum is at the end of the array.
function TestForChecksum(data) {
  length_data = data.length;
  let checksum_index = length_data - 1;
  let checksum = data[checksum_index];
  // print(data);
  // print("checksum: " + checksum);  
  data = data.slice(0, checksum_index);
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    // print(data[i]);
    result = result ^ data[i];
  }
  if (checksum == result) {
    print("array checksum and result are equals.");
  } else {
    print("Array and checksum are not the same.");
  }
  return checksum === result;
}

function only_data(packet_array) {
  let last_index = packet_array.length - 1;
  var ret = packet_array.slice(PACKET_IDENTIFICATION_START_INDEX + 1, last_index);

  return ret;
}

//For the rest of the packet, without the identity byte at the begining and at the end, 
//We need to escape the data 
//0x7e ??0x7d followed by 0x02
//0x7d ??0x7d followed by 0x01
//Right now it just convert it to expand to more bytes not to reduce the byte size.
function escape_data_expand(data_array) {
  let ret_escaped_data_array = [];
  //todo go thorugh the data and escape it.
  for (let i = 0; i < data_array.length; i++) {
    //check if we need to escape the byte.
    //if no, add it and continue
    //else find which one we need to escape it to.
    let i_data_byte = data_array[i];
    let need_to_be_escaped = false;
    for (let j = 0; j < ESCAPED_BYTES.length; j++) {
      j_escaped_byte = ESCAPED_BYTES[j];
      if (j_escaped_byte === i_data_byte) {
        need_to_be_escaped = true;
        escaped_bytes_array = ESCAPED_BYTES_TO_BE_CONVERTED_TO[j];
        for (let k = 0; k < escaped_bytes_array.length; k++) {
          k_data = escaped_bytes_array[k];
          ret_escaped_data_array.push(k_data);
        }
        break;
      }
    }
    if (!need_to_be_escaped) {
      ret_escaped_data_array.push(i_data_byte);
    }

  }
  return ret_escaped_data_array;
}
function get_message_id(data_array) {
  arr_message_id = data_array.slice(MESSAGE_ID_START_INDEX, MESSAGE_ID_END_INDEX + 1);
  //todo add to be two bytes.
  // print("---- This is the arr_message_id: " +arr_message_id );
  ret = getIntFromData_one(arr_message_id);
  // print("get_message_id : this is the ret: " + ret);
  return ret;
}

function get_message_id_type(number) {
  for (key in MessageID_types) {
    // print("this is the type checked: " + key);
    if (number === MessageID_types[key]) {
      // print("this is the key :" + key)
      return key;
    }
  }
  return MessageID_ERROR;
}

function getIntFromData(data_array, startIndex, endIndex) {
  var ret = 0;
  for (var i = startIndex; i < endIndex + 1; i++) {
    var raw_byte = data_array[i];
    // print("raw_byte: "+ raw_byte)
    if (raw_byte == 0) {
      continue;
    }
    ret = ret << 8;
    ret += raw_byte;

  }
  return ret;
}

function getIntFromData_one(data_array) {
  var ret = 0;
  for (var i = 0; i < data_array.length; i++) {
    var raw_byte = data_array[i];
    // if(raw_byte == 0){
    //   continue;
    // }
    ret = ret << 8;
    ret += raw_byte;

  }
  return ret;
}

function get_message_length(message_prop_num) {
  // let num = getIntFromData_one(data_array);
  let length_raw = MASK_MESSAGE_LENGTH & message_prop_num;
  // print("This is message length: " + length_raw);
  return length_raw;
}

function get_message_encryption_numer(message_prop_num) {
  let ret = MASK_ENCRYPTION & message_prop_num;
  ret = ret >> MESSAGE_ENCRYPTION_INDEX;

  return ret;
}
function is_message_encypted(num_encryption) {
  if (num_encryption === MESSAGE_IS_ENCRYPTED) {
    return true;
  }
  if (num_encryption === MESSAGE_IS_NOT_ENCRYPTED) {
    return false;
  }

  //todo this is for reserved case. 
  //Does that mean that the device is encrypted or not?
  return true;

}
function get_message_serial(data_array) {
  return getIntFromData(data_array, MSG_SERIAL_START_INDEX, MSG_SERIAL_END_INDEX);
}

function get_messge_body_properties(data_array) {
  message_properties_raw = data_array.slice(MESSAGE_BODY_PROPERTIES_START_INDEX, MESSAGE_BODY_PROPERTIES_END_INDEX + 1);

  return message_properties_raw;
}

//Terminal Registration Reply : (0x8100) to Terminal Register message ID: 0x0100 which was sent from device.
//This is an example to test.
function get_service_reply_to_register() {
  var data = new Uint8Array(4);
  // Answer Serial number 
  data[0] = 0x00;
  data[1] = 0x33;

  // Result 
  data[2] = 0x00;

  // Authentication Code 
  data[3] = 0x01;
  return data;
}

function get_platform_reply_to_terminal_authentication() {
  var data = new Uint8Array(11);
  data[0] = 0x7e;
  data[1] = 0x80;
  data[2] = 0x01;
  data[3] = 0x0;
  data[4] = 0x4;
  data[5] = 0x00;
  data[6] = 0x33;
  data[7] = 0x00;
  data[8] = 0x00;
  data[9] = 0xB6;
  data[10] = 0x7e;

  return data;
}
function getDeviceID_array(data_array) {
  return data_array.slice(DEVICE_ID_START_INDEX, DEVICE_ID_END_INDEX + 1);
}

function get_reply_body_to_terminal_authentication() {
  // var data = new Uint8Array(11);

  // //identity bit.
  // data[0] = 0x7e;

  // //Message body properties
  // //Message id:
  // data[1] = 0x80;
  // data[2] = 0x01;

  // //Message body properties (length is 2 byte which is word) :# bit 0 -> 10 is length in bytes 
  // data[3] = 0x0;
  // data[4] = 0x4;

  // // Answer Serial number 
  // data[5] = 0x00;
  // data[6] = 0x33;

  // // Answer ID 
  // data[7] = 0x00;

  // // Result
  // data[8] = 0x00;

  // //need to write checksum
  // data[9] = 0xB6;

  // //identity bit.
  // data[10] = 0x7e;

  var data = new Uint8Array(5);
  // Answer Serial number 
  data[0] = 0x00;
  data[1] = 0x33;

  // Answer ID = Message ID = 0x80 0x01
  data[2] = 0x01;
  data[3] = 0x02;

  // Result
  data[4] = 0x00;

  return data;
}

function numberTo8bitArray(decNumber) {
  var ls_res = [];
  while (decNumber > 0) {

    let byte = decNumber % 256;
    // print("This is byte:" + byte);
    ls_res.push(byte);
    decNumber = decNumber >> 8;
  }

  // print("ls_res : " + ls_res);
  len = ls_res.length;

  var data = new Uint8Array(len);
  // for(let i = len - 1 ; i >= 0 ; i--){
  for (let i = 0; i < len; i++) {
    let j = len - 1 - i;
    data[j] = ls_res[i];
    // print(`data[${j}]: ` + data[j]);

    // data[i] = ls_res[i];
    // print(`ls_res[${i}]: ` + ls_res[i]);
  }
  return data;
}

//Will reply: Platform_Common_Answer
function create_message_body_properties(message_length) {
  //This suppose to be the structure 2 byte: 
  // <Reserved (15-14)><Subcontractor(13)><Data Enrcyption(12-10)><Message body Length(9-0)>
  //For now all but length is 0.

  let message_body_properties_num = 65536 + message_length;
  var data = new Uint8Array(WORD_LEN_BYTES);
  let arr_num = numberTo8bitArray(message_body_properties_num);
  for (let i = 1; i < arr_num.length; i++) {
    // print(`create_message_body_properties -- arr_num[${i}]: ` + arr_num[i]);
    data[i - 1] = arr_num[i];
  }

  for (let i = 0; i < data.length; i++) {

  }

  return data;
}

function create_message_serial_arr(messageSerial) {
  //This suppose to be the structure 2 byte: 
  // <Reserved (15-14)><Subcontractor(13)><Data Enrcyption(12-10)><Message body Length(9-0)>
  //For now all but length is 0.

  let message_body_properties_num = 65536 + message_length;
  var data = new Uint8Array(WORD_LEN_BYTES);
  let arr_num = numberTo8bitArray(message_body_properties_num);
  for (let i = 1; i < arr_num.length; i++) {
    // print(`create_message_body_properties -- arr_num[${i}]: ` + arr_num[i]);
    data[i - 1] = arr_num[i];
  }

  for (let i = 0; i < data.length; i++) {
    // print(`create_message_body_properties -- data[${i}]: ` + data[i]);

  }

  return data;
}

function get_reply_header_to_terminal_authentication(message_body_length, reply_message_id, deviceID_byte_array, messageSerial, message_packet_Package_items) {
  //suppose to be 2 byte in big endian...
  let messageID_as_array = numberTo8bitArray(reply_message_id);
  print("messageID_as_array: " + messageID_as_array);

  let message_body_prop = create_message_body_properties(message_body_length);
  print("message_body_prop: " + message_body_prop);

  //fill with 10 bits as message properties is a word with 10 bit (first bits) and then the rest of it:

  //terminal mobile number: 
  print("deviceID_byte_array: " + deviceID_byte_array);
  let messageSerial_arr = create_message_serial_arr(messageSerial);
  print("messageSerial: " + messageSerial);
  print("messageSerial_arr: " + messageSerial_arr);

  let len_header = messageID_as_array.length + message_body_prop.length + deviceID_byte_array.length + messageSerial_arr.length;
  //Message packet Package Items
  var data = null;
  if (message_packet_Package_items != 0) {
    let message_packet_Package_items_arr = numberTo8bitArray(message_packet_Package_items);
    len_header += message_packet_Package_items_arr.length;
    var data = new Uint8Array(len_header);
    let j = 0;
    for (let i = 0; i < messageID_as_array.length; i++) {
      data[j + i] = messageID_as_array[i];
    }
    j += messageID_as_array.length;

    for (let i = 0; i < message_body_prop.length; i++) {
      data[j + i] = message_body_prop[i];
    }
    j += message_body_prop.length;

    for (let i = 0; i < deviceID_byte_array.length; i++) {
      data[j + i] = deviceID_byte_array[i];
    }
    j += deviceID_byte_array.length;

    for (let i = 0; i < messageSerial_arr.length; i++) {
      data[j + i] = messageSerial_arr[i];
    }
    j += messageSerial_arr.length;

    for (let i = 0; i < message_packet_Package_items_arr.length; i++) {
      data[j + i] = message_packet_Package_items_arr[i];
    }
    // j += message_packet_Package_items_arr.length;

  } else {
    let message_packet_Package_items_arr = numberTo8bitArray(message_packet_Package_items);

    var data = new Uint8Array(len_header);
    let j = 0;
    for (let i = 0; i < messageID_as_array.length; i++) {
      data[j + i] = messageID_as_array[i];
    }
    j += messageID_as_array.length;

    for (let i = 0; i < message_body_prop.length; i++) {
      data[j + i] = message_body_prop[i];
    }
    j += message_body_prop.length;

    for (let i = 0; i < deviceID_byte_array.length; i++) {
      data[j + i] = deviceID_byte_array[i];
    }
    j += deviceID_byte_array.length;

    for (let i = 0; i < messageSerial_arr.length; i++) {
      data[j + i] = messageSerial_arr[i];
    }
    // j += messageSerial_arr.length;



  }

  // return data;
  return data;
}

function get_crc(header, body) {
  let result = 0;
  if (header != null) {
    for (let i = 0; i < header.length; i++) {
      // result += result ^ data[i];
      result = result ^ header[i];
    }
  }

  if (body != null) {
    for (let i = 0; i < body.length; i++) {
      // result += result ^ data[i];
      result = result ^ body[i];
    }
  }

  return result;
}

function combine_body_header(header, body, checksum) {
  var len = 0;
  if (header != null && body != null) {
    len = header.length + body.length + 1;//+1 is for checksum
  }
  var data = new Uint8Array(len);
  let j = 0;
  if (header != null) {
    for (let i = 0; i < header.length; i++) {
      data[i + j] = header[i];
    }
    j += header.length;
  }

  if (body != null) {
    for (let i = 0; i < body.length; i++) {
      data[i + j] = body[i];
    }
  }
  if (len > 0) {
    data[len - 1] = checksum;
  }

  return data;
}



//For the rest of the packet, without the identity byte at the begining and at the end, 
//We need to escape the data 
//0x7d followed by 0x02 ?? 0x7e
//0x7d followed by 0x01 ?? 0x7d
function escape_data_reduce(data_array) {
  let ret_escaped_data_array = [];
  need_to_be_escaped = false;

  for (let i = 0; i < data_array.length;) {
    let need_to_be_escaped = false;
    for (let j = 0; j < ESCAPED_BYTES.length; j++) {
      escaped_bytes_array = ESCAPED_BYTES_TO_BE_EXPANDED_TO[j];
      if ((i + 1 < (data_array.length)) &&
        data_array[i] == escaped_bytes_array[0] && data_array[i + 1] == escaped_bytes_array[1]) {
        need_to_be_escaped = true;
        ret_escaped_data_array.push(ESCAPED_BYTES[j]);
        i = i + 2;
        break;
      }
    }

    if (!need_to_be_escaped) {
      ret_escaped_data_array.push(data_array[i]);
      i = i + 1;
    }
  }
  return ret_escaped_data_array;
}

function add_identity_byte(data) {
  let len = data.length + 2;
  var data_with_identity = new Uint8Array(len);
  data_with_identity[0] = IDENTITY_BYTE;
  for (let i = 0; i < data.length; i++) {
    data_with_identity[i + 1] = data[i];
  }
  data_with_identity[len - 1] = IDENTITY_BYTE;
  return data_with_identity;
}

function getServerMessageReply(message_header_info) {

  messageID = message_header_info["message_id"];
  deviceID_byte_array = message_header_info["deviceID_byte_array"];

  //reply from the server.
  replyMessageheader = null;
  replyMessageBody = null;
  identityByte = IDENTITY_BYTE;
  let foundReply = true;




  switch (messageID) {
    // switch(message_type){
    case MessageID_types.Terminal_register_response:
      print("Terminal_register_response");
      //todo register device to appropriate data table.
      ret = get_service_reply_to_register();//todo change later according to the device we need to deal with.
      break;
    case MessageID_types.Platform_Common_Answer:
      print("Platform_Common_Answer");
      break;
    case MessageID_types.Terminal_Heartbeat:
      print("Terminal_Heartbeat");
      break;
    case MessageID_types.Terminal_Register:
      print("Terminal_Register");
      break;
    case MessageID_types.Terminal_Registration_Reply:
      print("Terminal_Registration_Reply");
      break;
    case MessageID_types.Terminal_Authentication:
      //Will reply: Platform_Common_Answer

      //todo get a reply with the appropriate header.
      // let header_array = getMessageHeader(messageID, messageBodyProperties, deviceID, messageNumber );
      // ret = get_service_reply_to_terminal_authentication();
      print("device: Terminal_Authentication");
      replyMessageBody = get_reply_body_to_terminal_authentication();
      let reply_message_id = MessageID_types.Platform_Common_Answer;
      let message_serial = 0x0;
      let message_packet_Package_items = 0;//Depends if we need package items.
      replyMessageheader = get_reply_header_to_terminal_authentication(replyMessageBody.length, reply_message_id, deviceID_byte_array, message_serial, message_packet_Package_items);

      break;
    case MessageID_types.Set_Terminal_Parameters:
      print("Set_Terminal_Parameters");
      break;
    case MessageID_types.Query_Terminal_Parameters:
      print("Query_Terminal_Parameters");
      break;
    case MessageID_types.Query_terminal_parameter_response:
      print("Query_terminal_parameter_response");
      break;
    case MessageID_types.Terminal_Control:
      print("Terminal_Control");
      break;
    case MessageID_types.Location_information_report:
      print("Location_information_report");

      //Should return 0x8001
      print("todo parse and save data. ");

      //Will reply: Platform_Common_Answer

      //todo get a reply with the appropriate header.
      // let header_array = getMessageHeader(messageID, messageBodyProperties, deviceID, messageNumber );
      // ret = get_service_reply_to_terminal_authentication();
      print("device: Terminal_Authentication");
      replyMessageBody = get_reply_body_to_terminal_authentication();
      let reply_message_id1 = MessageID_types.Platform_Common_Answer;
      let message_serial1 = 0x0;
      let message_packet_Package_items1 = 0;//Depends if we need package items.
      replyMessageheader = get_reply_header_to_terminal_authentication(replyMessageBody.length, reply_message_id1, deviceID_byte_array, message_serial1, message_packet_Package_items1);


      break;
    case MessageID_types.Location_Message_Query:
      print("Location_Message_Query");
      break;
    case MessageID_types.Location_message_query_response:
      print("Location_message_query_response");
      break;
    case MessageID_types.Artificial_confirm_alert_message:
      print("Artificial_confirm_alert_message");
      break;
    case MessageID_types.Text_Message_issued:
      print("Text_Message_issued");
      break;
    case MessageID_types.vehicle_control:
      print("vehicle_control");
      break;
    case MessageID_types.vehicle_control_response:
      print("vehicle_control_response");
      break;
    case MessageID_types.Set_Polygon_Area:
      print("Set_Polygon_Area");
      break;
    case MessageID_types.Delete_polygon_area:
      print("Delete_polygon_area");
      break;
    case MessageID_types.Set_Routine:
      print("Set_Routine");
      break;
    case MessageID_types.Delete_Routine:
      print("Delete_Routine");
      break;
    case MessageID_types.Data_downlink_unvarnished_transmission:
      print("Data_downlink_unvarnished_transmission");
      break;
    case MessageID_types.Data_uplink_unvarnished_transmission:
      print("Data_uplink_unvarnished_transmission");
      break;
    case MessageID_types.Bilnd_area_data_upload:
      print("Bilnd_area_data_upload");
      break;
    case MessageID_ERROR:
      print("MessageID_ERROR!!");
      foundReply = false;
    default:
      print("default");
      foundReply = false;
  }
  if (!foundReply) {
    return MessageID_ERROR;
  }
  print("This is the header:" + replyMessageheader);
  print("This is the body:" + replyMessageBody);

  let checksum = get_crc(replyMessageheader, replyMessageBody);
  print("This is the checksum: " + checksum);

  let data = combine_body_header(replyMessageheader, replyMessageBody, checksum);
  data = escape_data_expand(data);//expand the data
  print("This is the data after escaping and checking checksum: " + data);

  //Adding identity bit : 
  data = add_identity_byte(data);
  print("This is the data with identity byte: " + IDENTITY_BYTE + "  :" + data);

  return data;
}

//Will return null if the dataArray is not ok
function DealDataArray(dataArray) {
  //Test if data array is not corrupted
  is_ok = check_identify_byte(dataArray);
  if (!is_ok) {
    print("Identity byte test failed");
    return null;
  }
  // console.log("check_identify_byte: " + is_ok)
  var data = only_data(dataArray); //with out identification byte

  data = escape_data_reduce(data);

  let checksum_res = TestForChecksum(data);

  if (!checksum_res) {
    print("checksum res:" + checksum_res);
    return null;
  }
  //todo switch reduce.. 
  // data = escape_data_expand(data);
  // print("data after escaping: " + data ); 
  deviceId = get_device_id(dataArray);
  print("deviceID: " + deviceId);

  // deviceID_Arr = get_device_id(dataArray);


  let message_id = get_message_id(data);
  // print("This is message id: " + message_id);
  let message_type = get_message_id_type(message_id);

  num_msg_prop = getIntFromData_one(get_messge_body_properties(data));
  // print("num_msg_prop: " + num_msg_prop);

  // print("this is the msg_prop: " + num_msg_prop);
  message_length = get_message_length(num_msg_prop);
  // print("This is message length: " + message_length);

  //todo test.
  message_encryption_number = get_message_encryption_numer(num_msg_prop);
  let is_msg_encrypted = is_message_encypted(message_encryption_number)

  // print("Is message encrypted: " + message_encryption_number);
  // print("is_msg_encrypted: " + is_msg_encrypted);
  msg_serial = get_message_serial(data);

  // print("msg serial: " + msg_serial);
  arr_deviceID = getDeviceID_array(data);

  let message_header_info = {
    message_id: message_id,
    message_type: message_type,
    message_length: message_length,
    message_encryption_number: message_encryption_number,
    is_msg_encrypted: is_msg_encrypted,
    message_body_properties: num_msg_prop,
    deviceID_byte_array: arr_deviceID,
    device_id: deviceId,
    serial_number: msg_serial,
  };
  print("--------");
  print(message_header_info);
  print("--------");

  if (message_type === MessageID_ERROR) {
    print("message_id: " + message_id + " has not been found at MessageID_types constant.");
    return null;
  } else {
    print("This is the message type : " + message_type);
  }
  //todo get message body  
  //todo send message body and parse them...
  let messageReply = getServerMessageReply(message_header_info,);
  print("This is the reply message: " + messageReply);
  return messageReply;

  // var ret = null ;
  // switch(message_id){
  // // switch(message_type){
  // case     MessageID_types.Terminal_register_response:
  //   print("Terminal_register_response");
  //   //todo register device to appropriate data table.
  //   ret = get_service_reply_to_register();
  //   break;
  // case MessageID_types.Platform_Common_Answer:
  //   print("Platform_Common_Answer");
  //   break;
  // case MessageID_types.Terminal_Heartbeat:
  //   print("Terminal_Heartbeat");
  //   break;
  // case MessageID_types.Terminal_Register:
  //   print("Terminal_Register");
  //   break;
  // case MessageID_types.Terminal_Registration_Reply:
  //   print("Terminal_Registration_Reply");
  //   break;
  // case MessageID_types.Terminal_Authentication:

  //   //todo get a reply with the appropriate header.
  //   // let header_array = getMessageHeader(messageID, messageBodyProperties, deviceID, messageNumber );
  //   ret = get_service_reply_to_terminal_authentication();
  //   print("get_service_reply_to_terminal_authentication");
  //   print("Terminal_Authentication");

  //   break;
  // case MessageID_types.Set_Terminal_Parameters:
  //   print("Set_Terminal_Parameters");
  //   break;
  // case MessageID_types.Query_Terminal_Parameters:
  //   print("Query_Terminal_Parameters");
  //   break;
  // case MessageID_types.Query_terminal_parameter_response:
  //   print("Query_terminal_parameter_response");
  //   break;
  // case MessageID_types.Terminal_Control:
  //   print("Terminal_Control");
  //   break;
  // case MessageID_types.Location_information_report:
  //   print("Location_information_report");
  //   break;
  // case MessageID_types.Location_Message_Query:
  //   print("Location_Message_Query");
  //   break;
  // case MessageID_types.Location_message_query_response:
  //   print("Location_message_query_response");
  //   break;
  // case MessageID_types.Artificial_confirm_alert_message:
  //   print("Artificial_confirm_alert_message");
  //   break;
  // case MessageID_types.Text_Message_issued:
  //   print("Text_Message_issued");
  //   break;
  // case MessageID_types.vehicle_control:
  //   print("vehicle_control");
  //   break;
  // case MessageID_types.vehicle_control_response:
  //   print("vehicle_control_response");
  //   break;
  // case MessageID_types.Set_Polygon_Area:
  //   print("Set_Polygon_Area");
  //   break;
  // case MessageID_types.Delete_polygon_area:
  //   print("Delete_polygon_area");
  //   break;
  // case MessageID_types.Set_Routine:
  //   print("Set_Routine");
  //   break;
  // case MessageID_types.Delete_Routine:
  //   print("Delete_Routine");
  //   break;
  // case MessageID_types.Data_downlink_unvarnished_transmission:
  //   print("Data_downlink_unvarnished_transmission");
  //   break;
  // case MessageID_types.Data_uplink_unvarnished_transmission:
  //   print("Data_uplink_unvarnished_transmission");
  //   break;
  // case MessageID_types.Bilnd_area_data_upload:
  //   print("Bilnd_area_data_upload");
  //   break;
  // case MessageID_ERROR:
  //   print("MessageID_ERROR!!");
  // default:
  //   print("default");

  // }


  // //Return appropriate reply to message type. 
  // print("returning get_platform_reply_to_terminal_authentication:");
  // return ret;

}


function loadPrevACC() {
  try {
    const data = fs.readFileSync(PREV_ACC_FILE_PATH, 'utf8');
    prevACC = JSON.parse(data);
  } catch (error) {
    console.error("Failed to load prevACC data:", error);
    prevACC = {}; // Initialize with an empty object if loading failed
  }
}

module.exports.parse = function (request, dataBuffer, dataArray) {
  console.log(request)

  //  loadPrevACC() 
  
  return new Promise(async function (resolve, reject) {
    const FuncTag = TAG + "parse: ";
    var ret = DealDataArray(dataArray);
    print("This is ret : " + ret);

    if (ret != null) {
      console.log("this is the data: ");
      console.log("dataArray.length: " + dataArray.length);
      for (var i = 0; i < dataArray.length; i++) {
        var num = dataArray[i];
        let hexString = num.toString(16);

        print("data[" + i + "]= " + hexString)

      }
      resolve(ret);
    }




    // //Testing for error of start or end bit:
    // if (
    //   dataArray[0] != 120 ||
    //   dataArray[1] != 120 ||
    //   dataArray[dataArray.length - 2] != 13 ||
    //   dataArray[dataArray.length - 1] != 10
    // ) {
    //   console.log(FuncTag + "start or end bit error");
    //   console.log("this is the data: ");
    //   console.log("dataArray.length: " + dataArray.length);
    //   for(var i = 0 ; i < dataArray.length ; i++){
    //     var num = dataArray[i];
    //     let hexString = num.toString(16);
    //     // console.log(hexString);
    //     console.log( "data[" + i + "]= " + hexString);
    //     // console.log( "data[" + i + "]= " + dataArray[i]);
    //   }

    //   is_ok = check_identify_byte(dataArray);
    //   console.log("check_identify_byte: " + is_ok);

    //   deviceId = get_device_id(dataArray);
    //   print("deviceID: " + deviceId);

    //   //This is the type of message . 
    //   //Let's try return       
    //   // return null;

    //   resolve(get_service_reply_to_register());
    // }

    var errorCheckValid = true;
    var packetLength = dataArray[2];//
    request.packetType = dataArray[3];//
    var snArray;
    var response;

    if (request.packetType == packetTypes.login && packetLength == 13) {
      //MongoDB related stuff:

      console.log(FuncTag + "packetType Login");
      snArray = Buffer.from([dataArray[12], dataArray[13]]);
      request.packetSerial = snArray.readUInt16BE(0);
      console.log(request.packetSerial + "request.packetSerial")
      request.imei = "";
      for (var i = 4; i < 12; i++) {
        var bits = functions.decimalToBits(dataArray[i]);
        if (bits.status == consts.statusError) {
          console.log(
            FuncTag + " functions.decimalToBits error for " + dataArray[i]
          );
          return null;
        } else {
          request.imei += bitsToStringAsHex(bits.bits);
        }

      }
      request.imei = request.imei.slice(1);
      console.log(request.imei + " requestimei  :");
      console.log("timestampToString" + request.timestamp)

      response = [];
      errorCheckValid = checkErrorValid(14, FuncTag, dataBuffer, dataArray);
      if (errorCheckValid) {
        response = buildResponseToPacket(
          request,
          dataArray,
          12,
          packetTypes.login
        );
        console.log(request.imei + " requestimei22  :");
        request = await parseIpPortToImei(request);
        snArray = Buffer.from([dataArray[36], dataArray[37]]);
        request.packetSerial = snArray.readUInt16BE(0);

        var date1 = parseDate(dataArray, 4, request.gmt);
        request.date = date1.date;
        request.time = date1.time;
        console.log(date1.date + " " + date1.time + "       2 345  :");


        var userInfo = {
          imei: request.imei,
          timestamp: request.timestamp,
          ip: request.ip,
          port: request.port,
          packetSerial: request.packetSerial,
        };
        var user = await carLocatorMongo.findOneFromCollection(
          { imei: request.imei },
          carLocatorConsts.usersCollection
        );
        if (user) {
          console.log(
            FuncTag + "user exists - updating login info for " + request.imei
          );
          await carLocatorMongo.updateCollection(
            { imei: request.imei },
            userInfo,
            carLocatorConsts.usersCollection
          );
        } else {
          console.log(
            FuncTag +
            "user does not exist - inserting login info for " +
            request.imei
          );
          await carLocatorMongo.insertToDB(
            userInfo,
            carLocatorConsts.usersCollection
          );
        }
      } else {
        resolve(null);
      }
      var previousRequest = request;
      // if(request!=previousRequest){

      resolve(response);


      console.log(request.imei.toString() + " requestimei12144 :");



    }
    else if (

      request.packetType == packetTypes.location &&
      (packetLength == 31 || packetLength == 35)

    ) {

      if (packetLength == 31) {

        console.log(FuncTag + "packetType Location mileage turned off");
        snArray = Buffer.from([dataArray[30], dataArray[31]]);
        console.log(snArray + "sna1")
        errorCheckValid = checkErrorValid(32, FuncTag, dataBuffer, dataArray);
      } else {
        console.log(FuncTag + "packetType Location mileage turned on");
        snArray = Buffer.from([dataArray[34], dataArray[35]]);
        errorCheckValid = checkErrorValid(36, FuncTag, dataBuffer, dataArray);
        console.log(snArray + "sna2")

      }
      if (!errorCheckValid) {
        resolve(null);
      }
      request = await parseIpPortToImei(request);
      //send parse to parseOriginalData from dataArray
      var date = parseOriginalData(dataArray, 4, 0);
      request.date = date.date;
      request.time = date.time;
      request.timestampSampled = date.timestampSampled;
      request.gpsInfoLength = parseInt(dataArray[10] / 16);
      request.numOfSatellites = dataArray[10] % 16;
      request.speed = dataArray[19]; // kmph
      request.packetSerial = snArray.readUInt16BE(0);
      request.latitude = dataBuffer.slice(11, 15).readUInt32BE(0) / 1800000.0;
      request.longitude = dataBuffer.slice(15, 19).readUInt32BE(0) / 1800000.0;
      request = parsePositionAzimuth(dataArray, request, 20, 21);
      let mmcCountryCodeBuffer = Buffer.from([dataArray[22], dataArray[23]]);
      request.mmcCountryCode = mmcCountryCodeBuffer.readUInt16BE(0);
      request.mobileNetworkCode = dataArray[24];//
      let locationAreaCodeBuffer = Buffer.from([dataArray[25], dataArray[26]]);
      request.locationAreaCode = locationAreaCodeBuffer.readUInt16BE(0);





      //DeviceID ? 
      let simCellIdBuffer = Buffer.from([
        0,
        dataArray[27],
        dataArray[28],
        dataArray[29],
      ]);
      request.simCellId = simCellIdBuffer.readUInt32BE(0);
      var locationSimilar = await carLocatorMongo.findOneFromCollection(
        {
          imei: request.imei,
          packetSerial: request.packetSerial,
          time: request.time,
          date: request.date,
        },
        carLocatorConsts.locationsCollection
      );
      if (locationSimilar) {
        console.log(FuncTag + " location already inserted");
      } else {
        //checkSpeedAndSendSms(request);
        await carLocatorMongo.insertToDB(
          request,
          carLocatorConsts.locationsCollection
        );
        const imei = request.imei;

        const currentTime = new Date().getTime();
        if (!lastSendTimes[request.imei] || (currentTime - lastSendTimes[request.imei]) >= 30000) {
          // This means we're clear to send for this IMEI
          lastSendTimes[request.imei] = currentTime; // Update the last send time for this IMEI
          if (!rowIdTracker.hasOwnProperty(request.imei)) {
            rowIdTracker[request.imei] = 0;
          }
          const nextRowId = ++rowIdTracker[request.imei];
          let config_gps = {
            "VehicleDirection": 0,
            "Timestamp_of_nfc": request.timestamp,
            "Nfc_is_correct": "Fake NFC is correct Yes",
            "NFCCode": 0,
            "RowID": nextRowId,
            "DeviceID": request.imei,
            "DateAndTimeStart": request.date + " " + request.time,
            "DateAndTimeEnd": request.date + " " + request.time, // Assuming format is correct and using Start for simplicity
            "AccumulatedDistance": 0,
            "Lat": request.latitude,
            "Lng": request.longitude,
            "VehicleStatus": 1,
            "VehicleSpeed": request.speed,
          };
          // saveTrackerStates();

          const config_gps_1 = JSON.stringify(config_gps);
   console.log("Skipping !!!");
          sendDataTestOtofusionURL(config_gps_1, "gps");
          sendAxios(config_gps_1, "gps");
          // Update the lastDateAndTimeStarts for this IMEI with the current DateAndTimeStart
        } else {
          console.log(`Skipping send for IMEI: ${imei} due to 30-second rule.`);
        }

        // Example of updating and logging location information (assuming imeiLocationMap is declared)
        function updateLocation(imei, Lat, Lng,DateAndTimeStart) {
          imeiLocationMap[imei] = { Lat: Lat, Lng: Lng,DateAndTimeStart:DateAndTimeStart};
          console.log(`Updated location for IMEI: ${imei} to Lat: ${Lat}, Lng: ${Lng}`);
        }

       
      }

      console.log('Before updateLocation', imeiLocationMap);

      updateLocation(request.imei, request.latitude,request.longitude,request.date + " " + request.time);
      // updateTime(request.imei,request.date + " " + request.time);

      console.log('After updateLocation', imeiLocationMap);

      // Later, before accessing it
      console.log(`Accessing ${request.imei} in imeiLocationMap`, imeiLocationMap[request.imei]);

      delete request._id;
      await carLocatorMongo.updateOneFromCollectionWithUpsert(
        { imei: request.imei },
        request,
        carLocatorConsts.lastLocationsCollection
      );
      response = buildResponseToPacket(
        request,
        dataArray,
        30,
        packetTypes.location
      );
      resolve(response);
    } else if (request.packetType == packetTypes.alarm && packetLength == 37) {
      errorCheckValid = checkErrorValid(38, FuncTag, dataBuffer, dataArray);

      if (!errorCheckValid) {
        resolve(response);
      }
      request = await parseIpPortToImei(request);
      snArray = Buffer.from([dataArray[36], dataArray[37]]);
      request.packetSerial = snArray.readUInt16BE(0);
      var date1 = parseOriginalData(dataArray, 4, 0);
      request.date = date1.date;
      request.time = date1.time;
      request.timestampSampled = date1.timestampSampled;
      request.gpsInfoLength = parseInt(dataArray[10] / 16);
      request.numOfSatellites = dataArray[10] % 16;
      request.latitude = dataBuffer.slice(11, 15).readUInt32BE(0) / 1800000.0;
      request.longitude = dataBuffer.slice(15, 19).readUInt32BE(0) / 1800000.0;
      request.speed = dataArray[19]; // kmph

      request = parsePositionAzimuth(dataArray, request, 20, 21);
      let mmcCountryCodeBuffer = Buffer.from([dataArray[23], dataArray[24]]);
      request.mmcCountryCode = mmcCountryCodeBuffer.readUInt16BE(0);
      request.mobileNetworkCode = dataArray[25];
      let locationAreaCodeBuffer = Buffer.from([dataArray[26], dataArray[27]]);
      request.locationAreaCode = locationAreaCodeBuffer.readUInt16BE(0);



      console.log("tostring" + request.imei);
      let simCellIdBuffer = Buffer.from([
        0,
        dataArray[28],
        dataArray[29],
        dataArray[30],
      ]);
      request.simCellId = simCellIdBuffer.readUInt32BE(0);
      request = parseStatusInformation(request, dataArray, 31);
      response = buildResponseToPacket(
        request,
        dataArray,
        36,
        packetTypes.alarm
      );
      await carLocatorMongo.insertToDB(
        request,
        carLocatorConsts.alarmsCollection
      );


      var user1 = await carLocatorMongo.findOneFromCollection(
        { imei: request.imei },
        carLocatorConsts.usersCollection
      );
      if (user1) {
        await handleAlarmLanguage(request, user1);
      } else {
        console.log(FuncTag + "user doesn't exist");
      }
      resolve(response);
    } else if (
      request.packetType == packetTypes.heartBeat &&
      packetLength == 10
    ) {
      errorCheckValid = checkErrorValid(11, FuncTag, dataBuffer, dataArray);
      if (!errorCheckValid) {
        resolve(null);
      }
      request = await parseIpPortToImei(request);
      snArray = Buffer.from([dataArray[9], dataArray[10]]);
      request.packetSerial = snArray.readUInt16BE(0);
      request = parseStatusInformation(request, dataArray, 4);
      await carLocatorMongo.insertToDB(
        request,
        carLocatorConsts.heartBeatsCollection
      )


      checkIgnitionFromHeartbeat(request);
      response = buildResponseToPacket(
        request,
        dataArray,
        9,
        packetTypes.heartBeat
      );
      resolve(response);
    } else if (request.packetType == packetTypes.smsCommandResponse) {
      console.log(FuncTag + "response to sms command and request is: ");
      //  console.log(request);
      var indexAfterCommand = 5 + dataArray[4];
      var commandLength = dataArray[4] - 4;
      console.log(FuncTag + "packet length is " + dataArray[2]);
      console.log(FuncTag + "command length is  " + dataArray[4]);
      console.log(FuncTag + "server flag bit is  " + dataArray.slice(5, 9));
      var CommandAscii = "";
      for (var t = 0; t < commandLength; t++) {
        CommandAscii += String.fromCharCode(dataArray[9 + t]);
      }
      console.log(FuncTag + "response command is " + CommandAscii);
      console.log(
        FuncTag +
        "language is   " +
        dataArray.slice(indexAfterCommand, indexAfterCommand + 2)
      );
      console.log(
        FuncTag +
        "serial number is " +
        dataArray.slice(indexAfterCommand + 2, indexAfterCommand + 3)
      );
      var errorCheckValid = checkErrorValid(
        indexAfterCommand + 4,
        FuncTag,
        dataBuffer,
        dataArray
      );
      if (errorCheckValid) {
        console.log(
          FuncTag + "response to sms error check bit passed with flying colors"
        );
      }
    }
    else {
      resolve(null);
    }
  });


};

function checkErrorValid(endIndex, tag, dataBuffer, dataArray) {
  var FuncTag = tag + "checkErrorValid: ";
  var errorCheckCalculated = crcItuCheck.crc16Ccitt(
    dataBuffer.slice(2, endIndex)
  );
  var errorCheckReceived = Buffer.from([
    dataArray[endIndex],
    dataArray[endIndex + 1],
  ]).readUInt16BE(0);
  console.log(
    FuncTag +
    "errorCheckCalculated = " +
    errorCheckCalculated +
    " , errorCheckReceived = " +
    errorCheckReceived
  );
  if (errorCheckCalculated == errorCheckReceived) {
    console.log(FuncTag + " error check passed, building response packet");
    return true;
  } else {
    console.log(
      FuncTag + " error check failed, returns null, no response to user"
    );
    return false;
  }
}

function parseIpPortToImei(request) {
  return new Promise(async function (resolve, reject) {
    var user = await carLocatorMongo.findOneFromCollection(
      { ip: request.ip, port: request.port },
      carLocatorConsts.usersCollection
    );
    if (user) {
      request.imei = user.imei;
      request.gmt = user.gmt;
      delete request.ip;
      delete request.port;
    }
    resolve(request);
  });
}


function parseStatusInformation(request, dataArray, startIndex) {
  request = parseTerminalInformation(request, dataArray[startIndex]);
  request = parseVoltageLevel(request, dataArray[startIndex + 1]);
  request = parseGSMSignalLevel(request, dataArray[startIndex + 2]);
  request = parseAlarmLanguage(request, dataArray[startIndex + 3]);
  if (dataArray[startIndex + 4] == 1) {
    request.language = "Chinese";
  } else if (dataArray[startIndex + 4] == 2) {
    request.language = "English";
  }
  return request;
}

function parsePositionAzimuth(dataArray, request, startIndex, endIndex) {
  var positionBytesArray = [];
  positionBytesArray.push(dataArray[startIndex]);
  positionBytesArray.push(dataArray[endIndex]);
  var firstByteBits = positionBytesArray[0].toString(2).padStart(8, '0');
  var secondByteBits = positionBytesArray[1].toString(2).padStart(8, '0');

  // Correct use of else
  if (firstByteBits[1] == "1" && firstByteBits[0] == "1") {
    request.ACC = 1;
  } else {
    request.ACC = 0;
  }
  // Other conditions corrected with else
  request.gpsRealTime = firstByteBits[2] == "0" ? 1 : 0;
  request.gpsPositioned = firstByteBits[3] == "1" ? 1 : 0;
  request.longitudeDirection = firstByteBits[4] == "1" ? "West" : "East";
  request.latitudeDirection = firstByteBits[5] == "1" ? "South" : "North";

  secondByteBits = firstByteBits[6] + firstByteBits[7] + secondByteBits;
  request.azimuth = parseInt(secondByteBits, 2);

  return request;
}




function parseOriginalData(dataArray, startIndex, gmt) {
  let year = dataArray[startIndex] + 2000;
  let month = dataArray[startIndex + 1];
  let day = dataArray[startIndex + 2];
  let hour = dataArray[startIndex + 3];
  let minute = dataArray[startIndex + 4];
  let second = dataArray[startIndex + 5];

  // Adjust the hour for GMT and wrap around if needed
  // if (hour >= 24) hour -= 24;
  // else if (hour < 0) hour += 24;

  // Convert all parts to strings with leading zeros where necessary
  month = month.toString().padStart(2, '0');
  day = day.toString().padStart(2, '0');
  minute = minute.toString().padStart(2, '0');
  second = second.toString().padStart(2, '0');
  hour = hour.toString().padStart(2, '0');

  let fullDate = `${day}-${month}-${year}`;
  let time = `${hour}:${minute}:${second}`

  console.log(fullDate, time + "full")
  return {
    date: fullDate,
    time: `${hour}:${minute}:${second}`,

    timestampSampled: functions.toTimestamp(
      month + "/" + day + "/" + year + " " + hour + ":" + minute + ":" + second
    ),
  };
}
function parseDate(dataArray, startIndex, gmt) {
  var year = dataArray[startIndex] + 2000;
  var month = dataArray[startIndex + 1] + 0;
  var day = dataArray[startIndex + 2] + 0;
  var hour = dataArray[startIndex + 3] - 8 + parseInt(gmt);
  var minute = dataArray[startIndex + 4] + 0;
  var second = dataArray[startIndex + 5] + 0;
  if (dataArray[3] == 18) {
    console.log(year, month, day, hour, minute, second, gmt + "year, month, day, hour, minute, second");
    console.log(dataArray + "array")
  }
  let ts = Date.now();
  let convertedTs = ts + gmt * 3600 * 1000;
  let date_ob = new Date(convertedTs);
  let convertedDate = date_ob.getDate();
  let convertedMonth = date_ob.getMonth() + 1;
  let convertedYear = date_ob.getFullYear();

  if (second < 10) {
    second = "0" + second;
  }
  if (minute < 10) {
    minute = "0" + minute;
  }
  if (hour < 0) {
    hour = hour + 24;
  }
  if (hour > 24) {
    hour = hour - 24;
  }
  if (hour < 10) {
    hour = "0" + hour;
  }
  if (day < 10) {
    day = "0" + day;
  }
  if (month < 10) {
    month = "0" + month;
  }

  if (convertedDate < 10) {
    convertedDate = "0" + convertedDate;
  }
  if (convertedMonth < 10) {
    convertedMonth = "0" + convertedMonth;
  }
  if (convertedYear < 10) {
    convertedYear = "0" + convertedYear;
  }

  let fullDate = convertedYear + "-" + convertedMonth + "-" + convertedDate;

  return {
    date: fullDate,
    time: hour + ":" + minute + ":" + second,
    timestampSampled: functions.toTimestamp(
      month + "/" + day + "/" + year + " " + hour + ":" + minute + ":" + second
    ),
  };
}

function bitsToStringAsHex(bits) {
  var result = "";
  var value = 0;
  var offset = 1;
  for (var i = 3; i >= 0; i--) {
    value += bits[i] * offset;
    offset = offset * 2;
  }
  result = result + value + "";
  value = 0;
  offset = 1;
  for (i = 7; i >= 4; i--) {
    value += bits[i] * offset;
    offset = offset * 2;
  }
  result = result + value + "";
  return result;
}

function buildResponseToPacket(request, dataArray, snStartIndex, packetType) {
  var FuncTag = TAG + "buildResponseToPacket: ";
  var response = [
    120,
    120,
    5,
    packetType,
    dataArray[snStartIndex],
    dataArray[snStartIndex + 1],
  ];
  var checkError = crcItuCheck.crc16Ccitt(Buffer.from(response).slice(2));
  console.log(FuncTag + "check error = " + checkError);
  var checkErrorBits = checkError.toString(2);
  while (checkErrorBits.length < 16) {
    checkErrorBits = "0" + checkErrorBits;
  }
  var value = 0;
  var offset = 1;
  for (var i = 7; i >= 0; i--) {
    value = value + parseInt(checkErrorBits[i]) * offset;
    offset = offset * 2;
  }
  response.push(value);
  value = 0;
  offset = 1;
  for (i = 15; i > 7; i--) {
    value = value + parseInt(checkErrorBits[i]) * offset;
    offset = offset * 2;
  }
  response.push(value);
  response.push(13);
  response.push(10);
  return Buffer.from(response);
}

function parseTerminalInformation(request, byte) {
  var bits = byte.toString(2);
  while (bits.length < 8) {
    bits = "0" + bits;
  }
  if (bits[0] == "0") {
    request.gasOilElectricityConnected = true;
  } else {
    request.gasOilElectricityConnected = false;
  }
  if (bits[1] == "1") {
    request.gpsTrackingOn = true;
  } else {
    request.gpsTrackingOn = false;
  }
  // let previousAlarm = null; // D
  function isLocationDataOld(lastReceivedTimeStr) {
    const lastReceivedTime = new Date(lastReceivedTimeStr);
    const currentTime = new Date();
    const timeDiff = currentTime - lastReceivedTime; // Difference in milliseconds
    const minutesPassed = timeDiff / (1000 * 60); // Convert milliseconds to minutes
    return minutesPassed > 5;
  }
  
  var alarmCode = bits[2] + "" + bits[3] + "" + bits[4];
  if (alarmCode == "100") {
    request.alarm = "SOS";
  } else if (alarmCode == "011") {
    request.alarm = "Low Battery Alarm";
  } else if (alarmCode == "010") {
    request.alarm = "Power Cut Alarm";
    if (!rowIdTracker_Power_Cut.hasOwnProperty(request.imei)) {
      rowIdTracker_Power_Cut[request.imei] = 0; // Start with 0 so the first use will be 1
  }
  rowIdTracker_Power_Cut[request.imei] += 1;
    // A Power Cut Alarm event is sent to Otofusion
    const Power_Cut = {

      "RowID": rowIdTracker_Power_Cut[request.imei].toString(),
      "DeviceID": request.imei,
      "ConfigVersionId": "4.5",
      "MaxValue": 0,
      "VehicleDirection": 0,
      "DateAndTimeStart": request.date + " " + request.time,
      "DateAndTimeEnd": request.date + " " + request.time,
      "EventID": 302,
      "AccumulatedDistance": 0,
      "Lat": request.latitude,
      "VehicleStatus": request.alarm,
      "VehicleSpeed": request.speed,
      "Lng": request.longitude,
    };

    const Power_Cut1 = JSON.stringify(Power_Cut)
    console.log('EventID has changed. Executing code.');
    sendDataTestOtofusionURL(Power_Cut1, "event");
    sendAxios(Power_Cut1, "event");
    console.log("its alarm                                       :" + Power_Cut1);

  } else if (alarmCode == "001") {
    // A Shock Alarm event is sent to Otofusion
    request.alarm = "Shock Alarm";
    if (!rowIdTracker_Shock.hasOwnProperty(request.imei)) {
      rowIdTracker_Shock[request.imei] = 0; // Start with 0 so the first use will be 1
    }
    rowIdTracker_Shock[request.imei] += 1;
    const config_shock = {

      "RowID": rowIdTracker_Shock[request.imei].toString(),
      "DeviceID": request.imei,
      "ConfigVersionId": "4.5",
      "MaxValue": 0,
      "VehicleDirection": 0,
      "DateAndTimeStart": request.date + " " + request.time,
      "DateAndTimeEnd": request.date + " " + request.time,
      "EventID": 305,
      "AccumulatedDistance": 0,
      "Lat": request.latitude,
      "VehicleStatus": request.alarm,
      "VehicleSpeed": request.speed,
      "Lng": request.longitude,

    };

    const config_shock1 = JSON.stringify(config_shock)
    console.log('EventID has changed. Executing code.');
    sendDataTestOtofusionURL(config_shock1, "event");
    sendAxios(config_shock1, "event");
    console.log("its alarm                                       :" + config_shock1);
  } else if (alarmCode == "000") {
    request.alarm = "Normal";
  }


  if (bits[5] == "1") {
    request.charge = true;
  } else {
    request.charge = false;
  }

  if (bits[6] == "1") {
    request.ACC = "high";
    console.log(`Current ACC: ${request.ACC}, Previous ACC for IMEI ${request.imei}: ${prevACC[request.imei]}`);
    // Check if ACC has changed from its previous state
    if (prevACC[request.imei] !== "high") {

      console.log(`ACC state changed to high for IMEI ${request.imei}`);

      if (!rowIdTracker_ACC_ON.hasOwnProperty(request.imei)) {
        rowIdTracker_ACC_ON[request.imei] = 0; // Start with 0 so the first use will be 1
      }
      rowIdTracker_ACC_ON[request.imei] += 1;
      console.log(`Row ID for ACC ON for IMEI ${request.imei}: ${rowIdTracker_ACC_ON[request.imei]}`);

      // A ACC event is sent to Otofusion
      const config_acc = {
        "RowID": rowIdTracker_ACC_ON[request.imei].toString(),
        "DeviceID": request.imei,
        "ConfigVersionId": "22",
        "MaxValue": 0,
        "VehicleDirection": 0,
        "DateAndTimeStart": request.date + "" + request.time,
        "DateAndTimeEnd": request.date + "" + request.time,
        "EventID": 1,
        "AccumulatedDistance": 0,
        "Lat": request.latitude,
        "Lng": request.longitude,
        "VehicleStatus": true,
        "VehicleSpeed": 0,
        "odometerDistance": 0,
      };


      if (imeiLocationMap.hasOwnProperty(request.imei) && 
      isLocationDataOld(imeiLocationMap[request.imei].DateAndTimeStart)) {
    config_acc.Lat = 0;
    config_acc.Lng = 0;
  } else {
    // Update Lat and Lng from imeiLocationMap if data is not older than 5 minutes
    config_acc.Lat = imeiLocationMap[request.imei].Lat;
    config_acc.Lng = imeiLocationMap[request.imei].Lng;
  }



    // savePrevACC();

      const configacc = JSON.stringify(config_acc);
      console.log(`Sending ACC ON event for IMEI ${request.imei}: ${configacc}`);

      console.log('EventID has changed. Executing code.');

      sendDataTestOtofusionURL(configacc, "event");
      sendAxios(configacc, "event");
      console.log(" request:" + "    8      +" + configacc);
      // config_acc.RowID=rowIdTracker_ACC_ON[request.imei].toString()
      prevACC[request.imei] = "high";
    }
  } else {
    request.ACC = "low";
    // Check if ACC has changed from its previous state
    if (prevACC[request.imei] !== "low") {
      if (!rowIdTracker_ACC_OFF.hasOwnProperty(request.imei)) {
        rowIdTracker_ACC_OFF[request.imei] = 0; // Start with 0 so the first use will be 1
      }
      rowIdTracker_ACC_OFF[request.imei] += 1;

      // A ACC event is sent to Otofusion-low
      const config_acc_off = {
        "RowID": rowIdTracker_ACC_OFF[request.imei].toString(),
        "DeviceID": request.imei,
        "ConfigVersionId": "D2",
        "MaxValue": 0,
        "VehicleDirection": 0,
        "DateAndTimeStart": request.date + "" + request.time,
        "DateAndTimeEnd": request.date + "" + request.time,
        "EventID": 2,
        "AccumulatedDistance": 0,
        "Lat": request.latitude,
        "Lng": request.longitude,
        "VehicleStatus": false,
        "VehicleSpeed": 0,
        "odometerDistance": 0,
      };


      config_acc_off.Lat = imeiLocationMap[request.imei].Lat;
      config_acc_off.Lng = imeiLocationMap[request.imei].Lng;
      prevACC[request.imei] = "low";
      const config_accoff = JSON.stringify(config_acc_off);
      console.log('EventID has changed. Executing code.');
      sendDataTestOtofusionURL(config_accoff, "event");
      sendAxios(config_accoff, "event");
      console.log(" request:" + "   12      +" + config_accoff);

    }
  }
  console.log(request)

  if (bits[7] == "1") {
    request.defenseActivated = true;




  } else {
    request.defenseActivated = false;
  }
  return request;
}

function parseVoltageLevel(request, byte) {
  switch (byte) {
    case 0:
      request.voltage = "No Power(shutdown)";
      break;
    case 1:
      request.voltage = "Extremely Low Battery";
      break;
    case 2:
      request.voltage = "Very Low Battery";
      break;
    case 3:
      request.voltage = "Low Battery";
      break;
    case 4:
      request.voltage = "Medium";
      break;
    case 5:
      request.voltage = "High";
      break;
    case 6:
      request.voltage = "Very High";
      break;
  }
  return request;
}

function parseGSMSignalLevel(request, byte) {
  switch (byte) {
    case 0:
      request.gsmSignalLevel = "No Signal";
      break;
    case 1:
      request.gsmSignalLevel = "Extremely weak";
      break;
    case 2:
      request.gsmSignalLevel = "Very weak";
      break;
    case 3:
      request.gsmSignalLevel = "Good";
      break;
    case 4:
      request.gsmSignalLevel = "Strong";
      break;
  }
  return request;
}

function parseAlarmLanguage(request, byte) {
  var FuncTag = TAG + "parse alarm language: ";
  console.log(FuncTag + "parsing alarm language");
  switch (byte) {
    case 0:
      request.alarmLanguage = "Normal";
      break;
    case 1:
      request.alarmLanguage = "SOS";
      break;
    case 2:
      request.alarmLanguage = "Power Cut Alarm";
      break;
    case 3:
      request.alarmLanguage = "Shock Alarm";
      break;
    case 4:
      request.alarmLanguage = "Fence In Alarm";
      break;
    case 5:
      request.alarmLanguage = "Fence Out Alarm";
      break;
    case 6:
      request.alarmLanguage = "Over Speed Alarm";
      break;
    case 9:
      request.alarmLanguage = "Moving Alarm";
      break;
    case 254:
      request.alarmLanguage = "ACC OFF Alarm";
      break;

    case 255:
      request.alarmLanguage = "ACC ON Alarm";
      break;
    default:
      console.log(FuncTag + "unknown alarm" + byte);
  }
  return request;
}

function handleAlarmLanguage(request, user) {
  return new Promise(async function (resolve, reject) {
    var FuncTag = TAG + "handleAlarmLanguage: ";
    var message;
    // set defualt notification language if not exists
    if (!user.notifyLng) {
      user.notifyLng = "en";
    }

    const payload = {
      notification: {
        title: "Friend Request",
        body: message,
      },
    };
    switch (request.alarmLanguage) {
      case "Normal":
        console.log(FuncTag + "no special Alarm detected");
        break;
      case "SOS":
        console.log(
          FuncTag + "SOS Alarm detected. user.notifyLng =" + user.notifyLng
        );
        message = carLocatorConsts
          .getMessageByLanguage(user.notifyLng, "sosAlertMessage")
          .replace("<LICENSE_NUMBER>", user.licenseNumber);
        payload.body = require("./sendSMS").sendSMS(message, user.sos);
        //await updatePushNotification("SOS", user);
        console.log(
          FuncTag +
          "sending sos with code: " +
          FireBaseNotifications.sosNotification
        );
        sendFireBaseNotification(user, FireBaseNotifications.sosNotification);
        break;
      case "Power Cut Alarm":
        console.log(FuncTag + "power cut Alarm detected");
        if (user.power_cut.status == true) {
          if (checkDatesInOrder(user, "power_cut")) {
            message = carLocatorConsts
              .getMessageByLanguage(user.notifyLng, "powerCutAlertMessage")
              .replace("<LICENSE_NUMBER>", user.licenseNumber);
            if (user.power_cut.sms) {
              require("./sendSMS").sendSMS(message, user.phoneNumber);
            }
            if (user.power_cut.email) {
              require("./SendEmail").sendEmail(
                message,
                user.email,
                user.notifyLng
              );
            }
            if (user.power_cut.push_status) {
              console.log(
                FuncTag +
                "sending power cut with code: " +
                FireBaseNotifications.powerCutNotification
              );
              //await updatePushNotification("power_cut", user);
              sendFireBaseNotification(
                user,
                FireBaseNotifications.powerCutNotification
              );
            }
          }
        }
        break;
      case "Shock Alarm":
        console.log(FuncTag + "shock Alarm detected");
        if (user.fear_accident.status == true) {
          if (checkDatesInOrder(user, "shock_alarm")) {
            message = carLocatorConsts
              .getMessageByLanguage(user.notifyLng, "shockAlarmAlertMessage")
              .replace("<LICENSE_NUMBER>", user.licenseNumber);
            if (user.fear_accident.sms) {
              require("./sendSMS").sendSMS(message, user.phoneNumber);
            }
            if (user.fear_accident.email) {
              require("./SendEmail").sendEmail(
                message,
                user.email,
                user.notifyLng
              );
            }
            if (user.fear_accident.push_status) {
              console.log(
                FuncTag +
                "sending shock alarm with code: " +
                FireBaseNotifications.shockAlarmNotification
              );
              //await updatePushNotification("shock_alarm", user);
              sendFireBaseNotification(
                user,
                FireBaseNotifications.shockAlarmNotification
              );
            }
          }
        }
        break;
      case "Fence In Alarm":
        console.log(
          FuncTag +
          "fencein Alarm detected sending with code " +
          FireBaseNotifications.FenceInNotification
        );
        break;
      case "Fence Out Alarm":
        console.log(
          FuncTag +
          "fence out Alarm detected sending with code " +
          FireBaseNotifications.FenceOutNotification
        );
        break;
      case "Over Speed Alarm":
        console.log(FuncTag + "Overspeed Alarm detected");
        if (user.speed_limit.status == true) {
          if (checkDatesInOrder(user, "speed_limit")) {
            message = carLocatorConsts
              .getMessageByLanguage(user.notifyLng, "overSpeedAlertMassage")
              .replace("<LICENSE_NUMBER>", user.licenseNumber);
            if (user.speed_limit.sms) {
              require("./sendSMS").sendSMS(message, user.phoneNumber);
            }
            if (user.speed_limit.email) {
              require("./SendEmail").sendEmail(
                message,
                user.email,
                user.notifyLng
              );
            }
            if (user.speed_limit.push_status) {
              console.log(
                FuncTag +
                "sending overspeed notification with code " +
                FireBaseNotifications.overSpeedNotification
              );
              //await updatePushNotification("speed_limit", user);
              sendFireBaseNotification(
                user,
                FireBaseNotifications.overSpeedNotification
              );
            }
          }
        }
        break;
      case "Moving Alarm":
        console.log(
          FuncTag +
          "sending moving alarm notification with code " +
          FireBaseNotifications.movingAlarmNotification
        );
        break;
      case "ACC OFF Alarm":
        console.log(
          FuncTag +
          "ACC OFF Alarm detected for imei = " +
          user.imei +
          " , time = " +
          Date.now()
        );

        if (user.ignition.status == true) {

          if (checkDatesInOrder(user, "ACC")) {
            message = carLocatorConsts
              .getMessageByLanguage(user.notifyLng, "ignitionOffAlertMessage")
              .replace("<LICENSE_NUMBER>", user.licenseNumber);
            if (user.ignition.sms) {
              require("./sendSMS").sendSMS(message, user.phoneNumber);
            }
            if (user.ignition.email) {
              require("./SendEmail").sendEmail(
                message,
                user.email,
                user.notifyLng
              );
            }

            if (user.ignition.push_status) {
              console.log(
                FuncTag +
                "sending ignition off notification with code " +
                FireBaseNotifications.ignitionOffNotification
              );
              //await updatePushNotification("ACC", user);
              sendFireBaseNotification(
                user,
                FireBaseNotifications.ignitionOffNotification
              );
            }
          }
        }
        break;
      case "ACC ON Alarm":
        console.log(
          FuncTag +
          "ACC ON Alarm detected for imei = " +
          user.imei +
          " , time = " +
          Date.now()
        );
        if (user.ignition.status == true) {
          if (checkDatesInOrder(user, "ACC")) {
            message = carLocatorConsts
              .getMessageByLanguage(user.notifyLng, "ignitionOnAlertMessage")
              .replace("<LICENSE_NUMBER>", user.licenseNumber);

            if (user.ignition.sms) {
              require("./sendSMS").sendSMS(message, user.phoneNumber);
            }
            if (user.ignition.email) {
              require("./SendEmail").sendEmail(
                message,
                user.email,
                user.notifyLng
              );
            }

            if (user.ignition.push_status) {
              console.log(
                FuncTag +
                "sending ignition on notification with code " +
                FireBaseNotifications.ignitionOnNotification
              );
              //await updatePushNotification("ACC", user);
              sendFireBaseNotification(
                user,
                FireBaseNotifications.ignitionOnNotification
              );
            }
          }
        }
        break;
      default:
        console.log(FuncTag + "unknown alarm");
    }
    resolve(request);
  });
}

async function checkIgnitionFromHeartbeat(request, user) {
  var FuncTag = TAG + "checkIgnition: ";
  var prevBeats = await carLocatorMongo.findWithSortFromCollection(
    {
      imei: request.imei,
    },
    { timestamp: 1 },
    carLocatorConsts.heartBeatsCollection
  );

  var user = await carLocatorMongo.findOneFromCollection(
    { imei: request.imei },
    carLocatorConsts.usersCollection
  );

  if (user) {
    // console.log(user+"user")
    // if (user.ignition.status) {

    if (checkDatesInOrder(user, "ACC")) {
      if (prevBeats.length > 1) {
        console.log("hiyou")
        var lastBeat = prevBeats[prevBeats.length - 2];
        switch (user.ignition.state) {
          case 1:
            if (checkIgnitionState(lastBeat, request) == "high") {
              // Update the previousAlarm for the next comparison
              console.log(FuncTag + "ignition on detected");
              var message = "ignition was turned on";
              if (user.ignition.sms) {
                require("./sendSMS").sendSMS(message, user.phoneNumber);
              }
              if (user.ignition.email) {
                require("./SendEmail").sendEmail(
                  message,
                  user.email,
                  request.lng
                );
              }
            }
            break;
          case 2:
            if (checkIgnitionState(lastBeat, request) == "low") {

              var message = "ignition was turned off";
              console.log(FuncTag + "ignition off detected");
              if (user.ignition.sms) {
                require("./sendSMS").sendSMS(message, user.phoneNumber);
              }
              if (user.ignition.email) {
                require("./SendEmail").sendEmail(
                  message,
                  user.email,
                  request.lng
                );
              }
            }
            break;

          case 0:
            var state = checkIgnitionState(lastBeat, request);
            if (state == "high") {
              console.log(FuncTag + "ignition on detected - sending sms");
              var message = "ignition was turned on";
              if (user.ignition.sms) {
                require("./sendSMS").sendSMS(message, user.phoneNumber);
              }
              if (user.ignition.email) {
                require("./SendEmail").sendEmail(
                  message,
                  user.email,
                  request.lng
                );
              }
            } else if (state == "low") {
              console.log(FuncTag + "ignition off detected - sending sms");
              var message = "ignition was turned off";
              if (user.ignition.sms) {
                require("./sendSMS").sendSMS(message, user.phoneNumber);
              }
              if (user.ignition.email) {
                require("./SendEmail").sendEmail(
                  message,
                  user.email,
                  request.lng
                );
              }
            } else {
              console.log(
                FuncTag + "no ignition was detected - doing nothing"
              );
            }
            break;

          default: {
            console.log(FuncTag + "no no valid ign preference fron user");
          }
        }
      } else {
        console.log(FuncTag + "no previous hearbeats found");
      }
    } else {
      console.log(FuncTag + "todays date doesn't match user preference");
    }

  } else {
    console.log(FuncTag + "user doesn't exist");
  }
}

function checkIgnitionState(lastBeat, request) {
  var FuncTag = TAG + "checkIgnition: ";
  console.log(
    FuncTag +
    "received heartbeatg from locatorimei:" +
    request.imei +
    "previous acc state was :" +
    lastBeat.ACC +
    "and current heartBeat is " +
    request.ACC
  );
  if (request.ACC == "high") {
    console.log("request.ACC  !" + request.ACC)
    if (lastBeat.ACC == "low") {
      return "high";
    } else {
      console.log(FuncTag + "ignition was high and still is high");
      return "none";
    }
  } else if (request.ACC == "low") {
    if (lastBeat.ACC == "high") {
      return "low";
    } else {
      console.log(FuncTag + "ignition was low and still is low");
      return "none";
    }
  } else {
    console.log(FuncTag + "unknown state of ignition");
    return "error";
  }
}

function checkDatesInOrder(user, alarmType) {
  var FuncTag = "checkDatesInOrder: ";
  var startTime;
  var endTime;
  var days;
  var allDayCheck;
  console.log(FuncTag + "checking dates");
  var convertedDate = new GmtDateConverter(user.gmt);
  switch (alarmType) {
    case "shock_alarm":
      console.log(FuncTag + "checking dates for shock alarm");
      startTime = user.fear_accident.startTime;
      endTime = user.fear_accident.endTime;
      days = user.fear_accident.days;
      allDayCheck = user.fear_accident.all_day;
      break;

    case "power_cut":
      console.log(FuncTag + "checking dates for power cut alarm");
      startTime = user.power_cut.startTime;
      endTime = user.power_cut.endTime;
      days = user.power_cut.days;
      allDayCheck = user.power_cut.all_day;
      break;

    case "speed_limit":
      console.log(FuncTag + "checking dates for power cut alarm");
      startTime = user.speed_limit.startTime;
      endTime = user.speed_limit.endTime;
      days = user.speed_limit.days;
      allDayCheck = user.speed_limit.all_day;
      break;

    case "ACC":
      console.log(FuncTag + "checking dates for ACC alarm");
      // startTime = user.ignition.startTime;
      // endTime = user.ignition.endTime;
      // days = user.ignition.days;
      // allDayCheck = user.ignition.all_day;

      break;
  }
  if (
    (convertedDate.compareTimes(startTime, endTime, allDayCheck) ||
      allDayCheck) &&
    convertedDate.comparePrefferedDays(days)
  ) {
    console.log(FuncTag + "times and dates are in order returning true");
    return true;
  }
  console.log(FuncTag + "date are not in order returning false");
  return false;
}

async function checkSpeedAndSendSms(request) {
  var FuncTag = TAG + "checkSpeedAndSendSms:";
  console.log(FuncTag + "checking speed alarm");

  var lastLocation = await carLocatorMongo.findOneFromCollection(
    { imei: request.imei },
    carLocatorConsts.lastLocationsCollection
  );

  var user = await carLocatorMongo.findOneFromCollection(
    { imei: request.imei },
    carLocatorConsts.usersCollection
  );
  if (user) {
    var limit = user.speed_limit.speed_limit_value;
    console.log(
      FuncTag +
      `user.speed_limit = ${user.speed_limit.status}, request.speed = ${request.speed}, limit = ${limit}, lastLocation.speed = ${lastLocation.speed}`
    );

    if (
      user.speed_limit.status &&
      request.speed >= limit &&
      lastLocation.speed < limit &&
      checkDatesInOrder(user, "speed_limit")
    ) {
      console.log(
        FuncTag +
        "apeed alarm triggered and user wants alarms and it is whitin time and date - notifying user"
      );
      var speedLimitMessage =
        "This is a message from CarLocator, you are over the defined speed limit of " +
        limit;
      if (user.ignition.sms) {
        require("./sendSMS").sendSMS(speedLimitMessage, user.phoneNumber);
        console.log(FuncTag + `sms sent = ${speedLimitMessage}`);
      }
      if (user.ignition.email) {
        require("./SendEmail").sendEmail(message, user.email, request.lng);
      }
    }
  } else {
    console.log(FuncTag + "user doesn't exist");
  }
}

function updatePushNotification(type, user) {
  return new Promise(async function (resolve, reject) {
    var FuncTag = TAG + "updatePushNotification: ";
    console.log(FuncTag + "updating push notifications for type " + type);
    var isDefined = false;
    if (typeof user.push !== "undefined") {
      console.log(FuncTag + "push is defined");
      isDefined = true;
    } else {
      console.log(FuncTag + "push is undefined");
      isDefined = false;
    }
    switch (type) {
      case "SOS":
        if (isDefined) {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: user.push.shock_alarm,
                power_cut: user.push.power_cut,
                speed_limit: user.push.speed_limit,
                ACC: user.push.ACC,
                SOS: true,
              },
            },
            carLocatorConsts.usersCollection
          );
        } else {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: false,
                power_cut: false,
                speed_limit: false,
                ACC: false,
                SOS: true,
              },
            },
            carLocatorConsts.usersCollection
          );
        }
        break;
      case "shock_alarm":
        if (isDefined) {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: true,
                power_cut: user.push.power_cut,
                speed_limit: user.push.speed_limit,
                ACC: user.push.ACC,
                SOS: user.push.SOS,
              },
            },
            carLocatorConsts.usersCollection
          );
        } else {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: true,
                power_cut: false,
                speed_limit: false,
                ACC: false,
                SOS: false,
              },
            },
            carLocatorConsts.usersCollection
          );
        }
        break;
      case "power_cut":
        if (isDefined) {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: user.push.shock_alarm,
                power_cut: true,
                speed_limit: user.push.speed_limit,
                ACC: user.push.ACC,
                SOS: user.push.SOS,
              },
            },
            carLocatorConsts.usersCollection
          );
        } else {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: false,
                power_cut: true,
                speed_limit: false,
                ACC: false,
                SOS: false,
              },
            },
            carLocatorConsts.usersCollection
          );
        }
        break;
      case "sped_limit":
        if (isDefined) {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: user.push.shock_alarm,
                power_cut: user.push.power_cut,
                speed_limit: true,
                ACC: user.push.ACC,
                SOS: user.push.SOS,
              },
            },
            carLocatorConsts.usersCollection
          );
        } else {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: false,
                power_cut: false,
                speed_limit: true,
                ACC: false,
                SOS: false,
              },
            },
            carLocatorConsts.usersCollection
          );
        }
        break;
      case "ACC":
        if (isDefined) {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: user.push.shock_alarm,
                power_cut: user.push.power_cut,
                speed_limit: user.push.speed_limit,
                ACC: true,
                SOS: user.push.SOS,
              },
            },
            carLocatorConsts.usersCollection
          );
          break;
        } else {
          await carLocatorMongo.updateCollection(
            {
              imei: user.imei,
            },
            {
              push: {
                shock_alarm: false,
                power_cut: false,
                speed_limit: true,
                ACC: false,
                SOS: false,
              },
            },
            carLocatorConsts.usersCollection
          );
        }
      default:
        resolve(false);
    }
    resolve(true);
  });
}
async function sendFireBaseNotification(user, message) {
  var FuncTag = TAG + "sendFireBaseNotification: ";
  console.log(FuncTag + "sending fire base notification to user");
  const payload = {
    data: {
      tag: message,
    },
  };
  if (admin) {
    try {
      if (user.fireBaseToken !== "") {
        admin
          .messaging()
          .sendToDevice(user.fireBaseToken, payload)
          .then((response) => {
            console.log(FuncTag + "fire base message sent successfully");
          })
          .catch((error) => {
            console.log(FuncTag + "error sending fire base message" + error);
          });
      } else {
        console.log(FuncTag + "users token is empty");
      }
    } catch (exception) {
      console.log(FuncTag + exception);
    }
  } else {
    console.log(FuncTag + "admin is null");
  }
}
