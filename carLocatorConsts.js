//jshint esversion: 8
const consts = require("../constants/consts");

module.exports = {
  carLocatorDatabase: "CarLocator",
  alarmsCollection: "alarms",
  locationsCollection: "location",
  lastLocationsCollection: "lastLocation",
  usersCollection: "users",
  adminsCollection: "admins",
  heartBeatsCollection: "heartBeats",
  carLocatorPort: 5007,
  statusError: "ERROR",
  statusOk: "OK",
  emailUser: "msg@mgsatellite.com",
  carLocatorDbConnect: function () {
    return new Promise((resolve, reject) => {
      consts.MongoClient.connect(
        consts.dbUrl,
        consts.warningFix,
        function (err, db) {
          if (err) {
            reject(err);
          }
          resolve({
            db: db,
            database: db.db(module.exports.carLocatorDatabase),
          });
        }
      );
    });
  },
  iw: {
    localizing: "iw",
    detailsMissingInRequest: "הבקשה חסרה בפרטים",
    licenseAndImeiDontMatch: "מספר הרישוי והIMEI של המכשיר לא תואמים",
    userAlreadyExist: "קיים משתמש עבור רכב זה",
    userDoesntExist: "המשתמש אינו קיים",
    wrongInfo: "מספר רכב או סיסמה שגויים",
    checkYourMailBox: "קוד אימות נשלח לתיבת המייל שלך ",
    badMailAddress: "בעיה בכתובת המייל שהוזנה",
    verificationCodeMailSubject: "קוד אישור לאימות למערכת מיקום רכב",
    GeneralServerMessage: "הודעה ממערכת מיקום הרכב",
    verificationCodeIsIncorrect: "קוד אישור לא חוקי",
    sessionExpired: "SESSION לא חוקי",
    endLocation: "מיקום אחרון",
    startLocation: "מיקום התחלתי",
    speed: "מהירות:",
    kmph: 'קמ"ש',
    address: "כתובת:",
    time: "זמן:",
    userNeverSentLocation: "לא קיימים מיקומים למשתמש זה",
    verifyUserEmail: "על מנת ליצור את המשתמש נשלח אלייך מייל לאישור",
    verifyUserSMS: "על מנת ליצור את המשתמש נשלח אלייך הודעה לפלאפון לאישור",
    azimuth: "אזימוט:",
    checkSMS: "יש לבדוק בהודעות הנייד את קוד האישור",
    errorSmsMailPreference: "שגיאה בהגדרת שליחה למייל או SMS",
    sosAlertMessage: "התראת מצוקה (SOS) נשלחה ממספר רכב: <LICENSE_NUMBER>",
    powerCutAlertMessage:
      "מכשיר המיקום המצומד למספר הרכב: <LICENSE_NUMBER> כבה",
    shockAlarmAlertMessage:
      "התראת חשש להתנגשות הופעלה!!!" +
      "\nקיים חשש לתאונה עבור מספר רכב: <LICENSE_NUMBER>",
    overSpeedAlertMassage:
      "התקבלה התראת נהיגה מעל המהירות המוגדרת עבור מספר רכב: <LICENSE_NUMBER>",
    ignitionOnAlertMessage: "התקבלה התראה על התנעת רכב מספר: <LICENSE_NUMBER>",
    ignitionOffAlertMessage: "התקבלה התראה על כיבוי רכב מספר: <LICENSE_NUMBER>",
  },
  en: {
    localizing: "en",
    detailsMissingInRequest: "Details missing in request",
    licenseAndImeiDontMatch: "License and imei don't match",
    userAlreadyExist: "User already exist for this vehicle",
    userDoesntExist: "User doesnt exist",
    wrongInfo: "invalid license number or password",
    checkYourMailBox: "Verification code sent to your mailbox ",
    badMailAddress: "Problem with email address inserted",
    verificationCodeMailSubject:
      "Verification code to enter CarLocation system",
    GeneralServerMessage: "Message From CarLocator",
    verificationCodeIsIncorrect: "Verification code incorrect",
    sessionExpired: "Session expired",
    endLocation: "Last location",
    startLocation: "Start location",
    speed: "Speed:",
    kmph: "Kmph",
    address: "Address:",
    time: "Time:",
    userNeverSentLocation: "No existing locations for this user",
    verifyUserEmail:
      "Verification code sent to your mailbox to activate new user",
    verifyUserSMS: "Verification code sent to your phone to activate new user",
    azimuth: "Azimuth:",
    checkSMS: "Check your phone SMS, verification code waiting there",
    errorSmsMailPreference: "SMS or mail preference error",
    sosAlertMessage:
      "SOS signal was sent from device with car number: <LICENSE_NUMBER>",
    powerCutAlertMessage:
      "Power was cut from device with car number: <LICENSE_NUMBER>",
    shockAlarmAlertMessage:
      "Accident alert has been turned on!!" +
      "\nCar number: <LICENSE_NUMBER> has been in a collision",
    overSpeedAlertMassage:
      "Driving over the limit for car number: <LICENSE_NUMBER>",
    ignitionOnAlertMessage:
      "Ignition ON has been detected for car number: <LICENSE_NUMBER>",
    ignitionOffAlertMessage:
      "Ignition OFF has been detected for car number: <LICENSE_NUMBER>",
  },
  getMessageByLanguage: function (lng, msgCode) {
    if (lng == "עברית" || lng == "iw") {
      return module.exports.iw[msgCode];
    }
    return module.exports.en[msgCode];
  },
};
