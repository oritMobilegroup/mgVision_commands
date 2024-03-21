//jshint esversion: 8
const TAG = "carLocatorWebRequestHandler: ";
const carLocatorConsts = require("./carLocatorConsts");
const carLocatorMongo = require("./carLocatorMongo");
const functions = require("../constants/functions");

module.exports.handle = function (request, response) {
  console.log(TAG);
  console.log(request);
  if ("action" in request) {
    switch (request.action) {
      case "checkVerificationCode":
        handleCheckVerificationCode(request, response);
        break;
      case "getVerificationCodeLogin":
        handleGetVerificationCode(request, response);
        break;
      case "getVerificationCodeSignUp":
        handleSignUp(request, response);
        break;
      case "checkSessionAlive":
        handleCheckSessionAlive(request, response);
        break;
      case "getLocationsByDate":
        handleGetLocationsByDate(request, response);
        break;
      case "logout":
        handleLogout(request, response);
        break;
      case "getLastCoordinates":
        handleGetLastCoordinated(request, response);
        break;
      case "getDrivingSettings":
        handleGetDrivingSettings(request, response);
        break;
      case "updateDrivingSettings":
        handleUpdateDrivingSettings(request, response);
        break;
      case "getLastFiveLocations":
        handleGetLastFiveLocations(request, response);
        break;
      case "getUserDetails":
        handleGetUserDetails(request, response);
        break;
      case "updateUserOneDetail":
        handleUpdateUserOneDetail(request, response);
        break;
      case "updateFireBaseToken":
        handleUpdateFireBaseToken(request, response);
        break;
      case "forgotMyPassword":
        handleForgotPassword(request, response);
        break;
      case "updateNotificationLng":
        handleUpdateNotificationLng(request, response);
        break;
      // case "checkPushNotification":
      //   handleCheckPushNotification(request, response);
      // ***
    }
  } else {
    console.log(TAG + " no action in POST request");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
};

async function handleSignUp(request, response) {
  const FuncTag = TAG + "handleSignUp: ";
  console.log(TAG);
  if (
    "licenseNumber" in request &&
    "password" in request &&
    "locatorImei" in request &&
    "phoneNumber" in request &&
    "email" in request &&
    "sos" in request
  ) {
    request.email = request.email.trim();
    request.phoneNumber = request.phoneNumber
      .trim()
      .replace("-", "")
      .replace("-", "")
      .replace(" ", "");
    request.password = request.password.trim();
    request.sos = request.sos
      .trim()
      .replace("-", "")
      .replace("-", "")
      .replace(" ", "");
    request.licenseNumber = request.licenseNumber.trim();
    request.locatorImei = request.locatorImei.trim();
    var user = await carLocatorMongo.findOneFromCollection(
      {
        licenseNumber: request.licenseNumber,
        imei: request.locatorImei,
      },
      carLocatorConsts.usersCollection
    );
    if (!user) {
      console.log(FuncTag + " licenseAndImeiDontMatch");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "licenseAndImeiDontMatch"
        ),
      });
    } else if (
      "phoneNumber" in user &&
      "password" in user &&
      "sos" in request &&
      user.verified
    ) {
      console.log(FuncTag + " userAlreadyExist");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "userAlreadyExist"
        ),
      });
    } else if (functions.validateEmail(request.email) == false) {
      console.log(FuncTag + " badMailAddress");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "badMailAddress"
        ),
      });
    } else {
      console.log(
        FuncTag +
          " user with licenseNumber " +
          request.licenseNumber +
          " signed up"
      );
      var sessionSerial = createSessionSerial();
      await carLocatorMongo.updateCollection(
        {
          licenseNumber: request.licenseNumber,
          imei: request.locatorImei,
        },
        {
          sos: request.sos,
          password: request.password,
          phoneNumber: request.phoneNumber,
          email: request.email,
          timestampSignUp: Date.now(),
          verified: false,
          sessionSerial: sessionSerial,
        },
        carLocatorConsts.usersCollection
      );
      if (request.preference == "email") {
        sendMail(sessionSerial, user.email, request.lng);
        response.send({
          status: carLocatorConsts.statusOk,
          sentText: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "verifyUserEmail"
          ),
        });
      } else if (request.preference == "sms") {
        require("./sendSMS").sendSMS(sessionSerial, user.phoneNumber);
        response.send({
          status: carLocatorConsts.statusOk,
          sentText: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "verifyUserSMS"
          ),
        });
      } else {
        console.log(FuncTag + "wrong preference value sent");
        response.send({
          status: carLocatorConsts.statusOk,
          sentText: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "errorSmsMailPreference"
          ),
        });
      }
      await carLocatorMongo.deleteManyFromCollection(
        { imei: user.imei },
        carLocatorConsts.locationsCollection
      );
      await carLocatorMongo.deleteManyFromCollection(
        { imei: user.imei },
        carLocatorConsts.alarmsCollection
      );
      await carLocatorMongo.deleteManyFromCollection(
        { imei: user.imei },
        carLocatorConsts.lastLocationsCollection
      );
      await carLocatorMongo.deleteManyFromCollection(
        { imei: user.imei },
        carLocatorConsts.heartBeatsCollection
      );
    }
  } else {
    console.log(FuncTag + " detailsMissingInRequest");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleGetVerificationCode(request, response) {
  const FuncTag = TAG + "handleGetVerificationCode: ";
  if ("licenseNumber" in request && "password" in request) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        licenseNumber: request.licenseNumber,
        password: request.password,
      },
      carLocatorConsts.usersCollection
    );
    if (!user || user.verified == false) {
      console.log(FuncTag + " userDoesntExist");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(request.lng, "wrongInfo"),
      });
    } else {
      var newSessionSerial = createSessionSerial();
      console.log(
        FuncTag +
          " found  with licenseNumber " +
          request.licenseNumber +
          " and password " +
          request.password +
          ", generated serial " +
          newSessionSerial
      );
      await carLocatorMongo.updateCollection(
        {
          licenseNumber: request.licenseNumber,
          password: request.password,
        },
        {
          sessionSerial: newSessionSerial,
        },
        carLocatorConsts.usersCollection
      );
      if (request.preference == "email") {
        sendMail(newSessionSerial, user.email, request.lng);
        response.send({
          status: carLocatorConsts.statusOk,
          sentText: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "checkYourMailBox"
          ),
        });
      } else if (request.preference == "sms") {
        require("./sendSMS").sendSMS(newSessionSerial, user.phoneNumber);
        response.send({
          status: carLocatorConsts.statusOk,
          sentText: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "checkSMS"
          ),
        });
      } else {
        console.log(FuncTag + "wrong preference value sent");
        response.send({
          status: carLocatorConsts.statusOk,
          sentText: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "errorSmsMailPreference"
          ),
        });
      }
    }
  } else {
    console.log(FuncTag + " detailsMissingInRequest");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

function createSessionSerial() {
  var newSessionSerial = "";
  for (i = 0; i < 6; i++) {
    newSessionSerial = newSessionSerial + Math.floor(Math.random() * 10);
  }
  return newSessionSerial;
}

function sendMail(sessionSerial, emailReceiver, lng) {
  const FuncTag = TAG + "sendMail: ";
  console.log(
    FuncTag +
      " sending mail to " +
      emailReceiver +
      " with session " +
      sessionSerial
  );
  var AWS = functions.getAwsSdk();
  const nodemailer = require("nodemailer");
  var transporter = nodemailer.createTransport({
    SES: new AWS.SES({
      apiVersion: "2010-12-01",
    }),
  });
  var mailOptions = {};
  mailOptions = {
    from: carLocatorConsts.emailUser,
    to: emailReceiver,
    subject: carLocatorConsts.getMessageByLanguage(
      lng,
      "verificationCodeMailSubject"
    ),
    text: "VerificationCode : " + sessionSerial,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(TAG + "Email sent: " + info.response);
    }
  });
}

async function handleCheckSessionAlive(request, response) {
  const FuncTag = TAG + "handleCheckSessionAlive: ";
  if (
    "licenseNumber" in request &&
    "password" in request &&
    "sessionSerial" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        licenseNumber: request.licenseNumber,
        password: request.password,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user && user.verified != false) {
      if ("gmt" in request) {
        await carLocatorMongo.updateCollection(
          {
            licenseNumber: request.licenseNumber,
            password: request.password,
          },
          { gmt: request.gmt },
          carLocatorConsts.usersCollection
        );
      }
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      response.send({ status: carLocatorConsts.statusError });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({ status: carLocatorConsts.statusError });
  }
}

async function handleCheckVerificationCode(request, response) {
  const FuncTag = TAG + "handleCheckVerificationCode: ";
  if (
    "licenseNumber" in request &&
    "password" in request &&
    "sessionSerial" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        licenseNumber: request.licenseNumber,
        password: request.password,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      if (user.verified == false) {
        await carLocatorMongo.updateCollection(
          {
            licenseNumber: request.licenseNumber,
            password: request.password,
            sessionSerial: request.sessionSerial,
          },
          { verified: true },
          carLocatorConsts.usersCollection
        );
      }
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "verificationCodeIsIncorrect"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

const NodeGeocoder = require("node-geocoder");
const options = {
  provider: "openstreetmap",
};

const geocoder = NodeGeocoder(options);
async function handleGetLocationsByDate(request, response) {
  const FuncTag = TAG + "handleGetLocationsByDate: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "timestampStart" in request &&
    "password" in request &&
    "timestampEnd" in request &&
    "lastLocationMode" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      var timestampStart = parseInt(request.timestampStart);
      var timestampEnd = parseInt(request.timestampEnd);
      var locations = [];
      if (request.lastLocationMode == "yes") {
        console.log(FuncTag + "getting last location for " + user.imei);
        locations = await carLocatorMongo.findFromCollection(
          { imei: user.imei },
          carLocatorConsts.lastLocationsCollection
        );
      } else {
        console.log(
          FuncTag +
            "getting locations from  " +
            timestampStart +
            " to " +
            timestampEnd +
            " for " +
            user.imei
        );
        locations = await carLocatorMongo.findWithSortFromCollection(
          {
            imei: user.imei,
            timestamp: { $gte: timestampStart, $lte: timestampEnd },
          },
          { timestamp: 1 },
          carLocatorConsts.locationsCollection
        );
      }
      console.log(FuncTag + "number of locations found is " + locations.length);
      var addressFirst = null;
      var addressLast = null;
      if (locations.length > 0) {
        try {
          addressFirst = await getAddress(
            { lat: locations[0].latitude, lon: locations[0].longitude },
            request.lng
          );
          addressLast = await getAddress(
            {
              lat: locations[locations.length - 1].latitude,
              lon: locations[locations.length - 1].longitude,
            },
            request.lng
          );
          console.log(FuncTag + "1st: " + addressFirst);
          console.log(FuncTag + "Last: " + addressLast);
        } catch (e) {
          console.log(FuncTag + " ERROR IN ADDRESS");
          console.log(e);
          addressFirst = "no address found";
          addressLast = "no address found";
        }
      }
      response.render("map", {
        locations: locations,
        startLocation: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "startLocation"
        ),
        endLocation: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "endLocation"
        ),
        speed: carLocatorConsts.getMessageByLanguage(request.lng, "speed"),
        kmph: carLocatorConsts.getMessageByLanguage(request.lng, "kmph"),
        addressFirst: addressFirst,
        addressLast: addressLast,
        time: carLocatorConsts.getMessageByLanguage(request.lng, "time"),
        localizing: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "localizing"
        ),
        azimuth: carLocatorConsts.getMessageByLanguage(request.lng, "azimuth"),
      });
    } else {
      console.log(FuncTag + "sessionExpired");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "sessionExpired"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

function getAddress(latLng, lng) {
  return new Promise(async function (resolve, reject) {
    var FuncTag = TAG + "getAddress: ";
    try {
      const res = await geocoder.reverse(latLng);
      if (res.length > 0) {
        var fullAddress =
          carLocatorConsts.getMessageByLanguage(lng, "address") + " ";
        if (res[0].streetName != undefined) {
          fullAddress += res[0].streetName + " ";
        }
        if (res[0].streetNumber != undefined) {
          fullAddress += res[0].streetNumber + ", ";
        }
        if (res[0].city != undefined) {
          fullAddress += res[0].city + " ";
        }
        if (res[0].country != undefined) {
          fullAddress += res[0].country;
        }
        resolve(fullAddress);
      } else {
        console.log(FuncTag + "no address found1");
        resolve(null);
      }
    } catch (e) {
      console.log(FuncTag + "no address found2");
      resolve(null);
    }
  });
}

async function handleLogout(request, response) {
  const FuncTag = TAG + "handleLogout: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "password" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      await carLocatorMongo.updateCollection(
        {
          password: request.password,
          licenseNumber: request.licenseNumber,
          sessionSerial: request.sessionSerial,
        },
        { sessionSerial: "" },
        carLocatorConsts.usersCollection
      );
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      console.log(FuncTag + "logout failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "sessionExpired"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleGetLastCoordinated(request, response) {
  const FuncTag = TAG + "handleGetLastCoordinated: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "password" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      var lastLocation = await carLocatorMongo.findOneFromCollection(
        {
          imei: user.imei,
        },
        carLocatorConsts.lastLocationsCollection
      );
      if (lastLocation) {
        response.send({
          status: carLocatorConsts.statusOk,
          coordinates: lastLocation.latitude + "," + lastLocation.longitude,
        });
      } else {
        console.log(FuncTag + "user never sent location");
        response.send({
          status: carLocatorConsts.statusError,
          reason: carLocatorConsts.getMessageByLanguage(
            request.lng,
            "userNeverSentLocation"
          ),
        });
      }
    } else {
      console.log(FuncTag + "logout failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "sessionExpired"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleGetDrivingSettings(request, response) {
  const FuncTag = TAG + "handleGetDrivingSettings: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "password" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      var resultJson = {};
      resultJson.status = carLocatorConsts.statusOk;
      if ("ignition" in user) {
        resultJson.ignition = user.ignition;
      } else {
        resultJson.ignition = null;
      }
      if ("speed_limit" in user) {
        resultJson.speed_limit = user.speed_limit;
      } else {
        resultJson.speed_limit = null;
      }
      if ("fear_accident" in user) {
        resultJson.fear_accident = user.fear_accident;
      } else {
        resultJson.fear_accident = null;
      }
      if ("power_cut" in user) {
        resultJson.power_cut = user.power_cut;
      } else {
        resultJson.power_cut = null;
      }
      if ("relay_val" in user) {
        resultJson.relay_val = user.relay_val;
      } else {
        resultJson.relay_val = null;
      }
      console.log(
        FuncTag +
          " response to imei " +
          user.imei +
          " licenseNumber " +
          request.licenseNumber
      );
      console.log(resultJson);
      response.send(resultJson);
    } else {
      console.log(FuncTag + " sessionExpired failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "sessionExpired"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleUpdateDrivingSettings(request, response) {
  const FuncTag = TAG + "handleUpdateDrivingSettings: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "password" in request &&
    "ignition" in request &&
    "power_cut" in request &&
    "fear_accident" in request &&
    "speed_limit" in request &&
    "relay_val" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      await carLocatorMongo.updateCollection(
        {
          imei: user.imei,
        },
        {
          speed_limit: JSON.parse(request.speed_limit),
          ignition: JSON.parse(request.ignition),
          fear_accident: JSON.parse(request.fear_accident),
          power_cut: JSON.parse(request.power_cut),
          relay_val: JSON.parse(request.relay_val),
        },
        carLocatorConsts.usersCollection
      );
      console.log(
        FuncTag +
          " response to imei " +
          user.imei +
          " licenseNumber " +
          request.licenseNumber +
          " is " +
          carLocatorConsts.statusOk
      );
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      console.log(FuncTag + " sessionExpired failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "sessionExpired"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleGetLastFiveLocations(request, response) {
  if ("imei" in request && "type" in request) {
    var collection = carLocatorConsts.locationsCollection;
    if (request.type == "alarm") {
      collection = carLocatorConsts.alarmsCollection;
    }
    var locations = await carLocatorMongo.findWithSortFromCollection(
      { imei: request.imei },
      { timestamp: -1 },
      collection
    );
    if (locations.length <= 5) {
      response.send(locations);
    } else {
      var i = 0;
      var result = [];
      while (i < 5) {
        result.push(locations[i]);
        i++;
      }
      response.send(result);
    }
  } else {
    response.send("no imei in request");
  }
}

async function handleGetUserDetails(request, response) {
  const FuncTag = TAG + "handleGetUserDetails: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "password" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
        sessionSerial: request.sessionSerial,
      },
      carLocatorConsts.usersCollection
    );
    if (user) {
      response.send({
        status: carLocatorConsts.statusOk,
        phoneNumber: user.phoneNumber,
        sos: user.sos,
        email: user.email,
        notifyLng: user.notifyLng,
      });
    } else {
      console.log(FuncTag + " getting user failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "userDoesntExist"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleUpdateUserOneDetail(request, response) {
  const FuncTag = TAG + "handleUpdateUserOneDetail: ";
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "password" in request &&
    "preference" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
      },
      carLocatorConsts.usersCollection
    );
    if (user && user.sessionSerial == request.sessionSerial) {
      var newSessionSerial = createSessionSerial();
      if ("phoneNumber" in request) {
        await carLocatorMongo.updateCollection(
          {
            imei: user.imei,
          },
          {
            phoneNumber: request.phoneNumber,
            sessionSerial: newSessionSerial,
          },
          carLocatorConsts.usersCollection
        );
      } else if ("sos" in request) {
        await carLocatorMongo.updateCollection(
          {
            imei: user.imei,
          },
          {
            sos: request.sos,
            sessionSerial: newSessionSerial,
          },
          carLocatorConsts.usersCollection
        );
      } else if ("email" in request) {
        await carLocatorMongo.updateCollection(
          {
            imei: user.imei,
          },
          {
            email: request.email,
            sessionSerial: newSessionSerial,
          },
          carLocatorConsts.usersCollection
        );
      } else if ("newPassword" in request) {
        await carLocatorMongo.updateCollection(
          {
            imei: user.imei,
          },
          {
            password: request.newPassword,
            sessionSerial: newSessionSerial,
          },
          carLocatorConsts.usersCollection
        );
      }

      console.log(
        FuncTag +
          " response to imei " +
          user.imei +
          " is " +
          carLocatorConsts.statusOk
      );
      if (request.preference == "email") {
        if ("email" in request) {
          sendMail(newSessionSerial, request.email, request.lng);
        } else {
          sendMail(newSessionSerial, user.email, request.lng);
        }
      } else if (request.preference == "sms") {
        if ("phoneNumber" in request) {
          require("./sendSMS").sendSMS(newSessionSerial, request.phoneNumber);
        } else {
          require("./sendSMS").sendSMS(newSessionSerial, user.phoneNumber);
        }
      } else {
        console.log(FuncTag + "wrong preference value sent");
      }

      response.send({ status: carLocatorConsts.statusOk });
    } else if (user) {
      console.log(FuncTag + " sessionExpired failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "sessionExpired"
        ),
      });
    } else {
      console.log(FuncTag + " userDoesntExist failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "userDoesntExist"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleUpdateFireBaseToken(request, response) {
  const FuncTag = TAG + "handleUpdateFireBaseToken: ";
  console.log(FuncTag + "updating fire base token");
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "fireBaseToken" in request &&
    "password" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
      },
      carLocatorConsts.usersCollection
    );

    if (user && user.sessionSerial == request.sessionSerial) {
      await carLocatorMongo.updateCollection(
        {
          imei: user.imei,
        },
        {
          fireBaseToken: request.fireBaseToken,
        },
        carLocatorConsts.usersCollection
      );
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      console.log(FuncTag + "wrong session serial");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "wrong session serial"
        ),
      });
    }
  }
}

async function handleForgotPassword(request, response) {
  FuncTag = TAG + "Forgot Password: ";
  if ("licenseNumber" in request && "preference" in request) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        licenseNumber: request.licenseNumber,
      },
      carLocatorConsts.usersCollection
    );

    if (user) {
      var message = "your password is " + user.password;
      if (request.preference == "email") {
        require("./SendEmail").sendEmail(message, user.email, request.lng);
      } else if (request.preference == "sms") {
        require("./sendSMS").sendSMS(message, user.phoneNumber);
      } else {
        console.log(FuncTag + "wrong preference value sent");
        response.send({ status: carLocatorConsts.statusError });
      }
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      console.log(FuncTag + " userDoesntExist failed");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "userDoesntExist"
        ),
      });
    }
  } else {
    console.log(FuncTag + " missing params");
    response.send({
      status: carLocatorConsts.statusError,
      reason: carLocatorConsts.getMessageByLanguage(
        request.lng,
        "detailsMissingInRequest"
      ),
    });
  }
}

async function handleUpdateNotificationLng(request, response) {
  const FuncTag = TAG + "handleUpdateNotificationLng: ";
  console.log(FuncTag + "updating notification language");
  if (
    "licenseNumber" in request &&
    "sessionSerial" in request &&
    "notifyLng" in request &&
    "password" in request
  ) {
    var user = await carLocatorMongo.findOneFromCollection(
      {
        password: request.password,
        licenseNumber: request.licenseNumber,
      },
      carLocatorConsts.usersCollection
    );

    if (user && user.sessionSerial == request.sessionSerial) {
      await carLocatorMongo.updateCollection(
        {
          imei: user.imei,
        },
        {
          notifyLng: request.notifyLng,
        },
        carLocatorConsts.usersCollection
      );
      response.send({ status: carLocatorConsts.statusOk });
    } else {
      console.log(FuncTag + "wrong session serial");
      response.send({
        status: carLocatorConsts.statusError,
        reason: carLocatorConsts.getMessageByLanguage(
          request.lng,
          "wrong session serial"
        ),
      });
    }
  }
}

// async function handleCheckPushNotification(request, response) {
//   const FuncTag = TAG + "handleCheckPushNotification: ";
//   if (
//     "licenseNumber" in request &&
//     "sessionSerial" in request &&
//     "password" in request
//   ) {
//     var user = await carLocatorMongo.findOneFromCollection(
//       {
//         password: request.password,
//         licenseNumber: request.licenseNumber,
//         sessionSerial: request.sessionSerial,
//       },
//       carLocatorConsts.usersCollection
//     );
//     if (user) {
//       console.log(FuncTag + " user found - sending response");
//       response.send({
//         status: carLocatorConsts.statusOk,
//         push_value: user.push,
//       });
//       console.log(FuncTag + " updating all push to false");
//       await carLocatorMongo.updateCollection(
//         {
//           imei: user.imei,
//         },
//         {
//           push: {
//             shock_alarm: false,
//             power_cut: false,
//             speed_limit: false,
//             ACC: false,
//             SOS: false,
//           },
//         },
//         carLocatorConsts.usersCollection
//       );
//     } else {
//       console.log(FuncTag + " getting user failed");
//       response.send({
//         status: carLocatorConsts.statusError,
//         reason: carLocatorConsts.getMessageByLanguage(
//           request.lng,
//           "userDoesntExist"
//         ),
//       });
//     }
//   } else {
//     console.log(FuncTag + " missing params");
//     response.send({
//       status: carLocatorConsts.statusError,
//       reason: carLocatorConsts.getMessageByLanguage(
//         request.lng,
//         "detailsMissingInRequest"
//       ),
//     });
//   }
// }
