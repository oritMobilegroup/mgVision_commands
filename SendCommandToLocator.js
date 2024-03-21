const carLocatorMongo = require("./carLocatorMongo");
const carLocatorConsts = require("./carLocatorConsts");
const crcItuCheck = require("./crcItuCheck");

class SendCommandToLocator {
  constructor(req, sockets) {
    this.sockets = sockets;
    this.req = req;
  }

  async sendMessage() {
    var FuncTag = "SendCommandToLocator: ";
    console.log(FuncTag + "sending message to locator");
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: this.req.password,
        licenseNumber: this.req.licenseNumber,
        sessionSerial: this.req.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );

    if (user) {
      var chosenSocket = null;
      console.log(
        FuncTag + "user ip is : " + user.ip + " and port is : " + user.port
      );
      for (const socket of this.sockets) {
        if (user.ip == socket.remoteAddress && user.port == socket.remotePort) {
          chosenSocket = socket;
          break;
        }
      }
      if (chosenSocket == null) {
        console.log(FuncTag + "no socket found");
        return false;
      }
      console.log(
        FuncTag +
          "trying to connect via tcp socket with ip: " +
          chosenSocket.remoteAddress +
          " and port: " +
          chosenSocket.remotePort
      );

      var message = [120, 120, 10 + this.req.command.length, 128];
      console.log(FuncTag + "length of command is " + this.req.command.length);
      message.push(this.req.command.length + 4);
      //message.push(toUTF8Array(this.req.command));	  message.push(0);
      message.push(0);
      message.push(0);
      message.push(0);
      message.push(0);
      for (var k = 0; k < this.req.command.length; k++) {
        message.push(this.req.command.charCodeAt(k));
      }
      message.push(0);
      message.push(1);
      var checkError = crcItuCheck.crc16Ccitt(Buffer.from(message).slice(2));
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
      message.push(value);
      value = 0;
      offset = 1;
      for (i = 15; i > 7; i--) {
        value = value + parseInt(checkErrorBits[i]) * offset;
        offset = offset * 2;
      }
      message.push(value);
      //message = createErrorCheckBits(message);
      message.push(13);
      message.push(10);
      console.log(
        FuncTag +
          "length of message is " +
          message.length +
          " writing to socket"
      );
      console.log(FuncTag + "sent request is ");
      console.log(Buffer.from(message));
      try {
        chosenSocket.write(Buffer.from(message));
      } catch (Exception) {
        console.log(FuncTag + "exception writing to socket");
        return false;
      }
      console.log(FuncTag + "writing to socket was good");
      return true;
    } else {
      console.log(FuncTag + "no user found");
      return false;
    }
  }
  checkErrorValid(endIndex, tag, dataBuffer, dataArray) {
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
}

function toUTF8Array(str) {
  let utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode =
        0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
}

module.exports = SendCommandToLocator;
