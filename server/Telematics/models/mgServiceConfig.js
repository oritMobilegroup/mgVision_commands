const mongoose = require('mongoose');
const { connectToTelematicsDB } = require('../../config/db');

const sensorSchema = new mongoose.Schema({
  IMEI: {
    type: String,
    required: true,
    unique: true
  },
  ConfigID: {
    type: String,
    default: "01"
  },
  md5: {
    type: String,
  },
  Data: {
    GPS: {
      SendGpsAccOn: { type: Number, default: 5 },
      SendGpsAccOff: { type: Number, default: 3600 },
      GpsAzimuth: { type: Number, default: 30 },
      SendGpsIdle: { type: Number, default: 120 },
      SendGpsAccumulateDistance: { type: Number, default: 150 },
      BackupBatteryX: { type: Number, default: 1800 },
      BackupBatteryFirstX: { type: Number, default: 60 },
      BackupBatteryAfterX: { type: Number, default: 1800 }
    },
    Temperature: {
      FrontSensorMac: { type: String, default: "" },
      RearSensorMac: { type: String, default: "" },
      SendTempRateAccOn: { type: Number, default: 5 },
      SendTempRateAccOff: { type: Number, default: 10 }
    },
    TirePressure: {
      SendTireRateAccOn: { type: Number, default: 0 },
      SendTireRateAccOff: { type: Number, default: 0 },
      ALeftIn: { type: String, default: "" },
      ALeftOut: { type: String, default: "" },
      BLeftIn: { type: String, default: "" },
      BLeftOut: { type: String, default: "" },
      CLeftIn: { type: String, default: "" },
      CLeftOut: { type: String, default: "" },
      DLeftIn: { type: String, default: "" },
      DLeftOut: { type: String, default: "" },
      ELeftIn: { type: String, default: "" },
      ELeftOut: { type: String, default: "" },
      ARightIn: { type: String, default: "" },
      ARightOut: { type: String, default: "" },
      BRightIn: { type: String, default: "" },
      BRightOut: { type: String, default: "" },
      CRightIn: { type: String, default: "" },
      CRightOut: { type: String, default: "" },
      DRightIn: { type: String, default: "" },
      DRightOut: { type: String, default: "" },
      ERightIn: { type: String, default: "" },
      ERightOut: { type: String, default: "" }
    },
    CAN: {
      Type: { type: String, default: "J1939" },
      Baudrate: { type: Number, default: 500 },
      Lock: { type: Number, default: 0 },
      EnQuery: { type: Number, default: 1 }
    },
    DriverCodeSettings: {
      Type: { type: String, default: "" },
      Style: { type: String, default: "allCodeOK" },
      BeepTimeout: { type: Number, default: 240 },
      WrongCodeLockDuration: { type: Number, default: 240 },
      HoldCodeValidationAccOff: { type: Number, default: 240 },
      WrongCodeCountBeforeLock: { type: Number, default: 5 },
      EmergencyEnStatus: { type: Number, default: 1 },
      IgnEnWithoutCode: { type: Number, default: 1 },
      TechnicianCode: { type: String, default: "123654987" },
      buzzerRateWrongCode: { type: Number, default: 3 }
    },
    DriverCodes: {
      type: [String],
      required: true,
      default: ["1325"]
    },
    EventsSettings: {
      '164': {
        active: { type: Number, default: 1 },
        Video: { type: Number, default: 1 },
        MinValue: { type: Number, default: 0 },
        MaxValue: { type: Number, default: 0 },
        OnDelay: { type: Number, default: 0 },
        OffDelay: { type: Number, default: 0 }
      },
      '261': {
        active: { type: Number, default: 1 },
        Video: { type: Number, default: 1 },
        MinValue: { type: Number, default: 0 },
        MaxValue: { type: Number, default: 0 },
        OnDelay: { type: Number, default: 0 },
        OffDelay: { type: Number, default: 0 }
      }
    },
    ActiveModules: {
      keypad: { type: Number, default: 0 },
      NFC: { type: Number, default: 1 },
      Gsensore: { type: Number, default: 1 },
      TirePressure: { type: Number, default: 1 },
      GpsOdometer: { type: Number, default: 1 },
      Adas: { type: Number, default: 1 },
      Dms: { type: Number, default: 1 },
      leech: { type: Number, default: 1 },
      Temperature: { type: Number, default: 1 },
      CoexistsUnit1: { type: Number, default: 1 },
      CoexistsUnit2: { type: Number, default: 1 },
      CoexistsUnit3: { type: Number, default: 1 },
      CoexistsUnit4: { type: Number, default: 1 },
      bt: { type: Number, default: 1 },
      CAN: { type: Number, default: 1 }
    },
    CalibrationCommands: {
      OdometerValue: { type: Number, default: 0 },
      WarmStart: { type: Number, default: 0 },
      GetLog: { type: Number, default: 0 },
      IgnEnWithoutCode: { type: String, default: "always" }
    },
    PowerOffSetting: {
      PowerOffDelayDefault: { type: Number, default: 7200 }
    },

  },
  VersionId: { type:String, 
    required:true}
}, { collection: 'MGServiceConfig', versionKey: false });  // Explicitly define the collection name

let MGServiceConfig;

const initializeModel = async () => {
  try {
    const telematicsConnection = await connectToTelematicsDB();
    if (telematicsConnection) {
      MGServiceConfig = telematicsConnection.model('MGServiceConfig', sensorSchema);
      console.log('MGServiceConfig model created for TelematicsDB');
    } else {
      console.error('Error initializing MGServiceConfig model: No TelematicsDB connection');
    }
  } catch (error) {
    console.error('Error initializing MGServiceConfig model:', error);
    throw error;
  }
};

const getMGServiceConfigModel = async () => {
  if (!MGServiceConfig) {
    await initializeModel();
  }
  return MGServiceConfig;
};

module.exports = getMGServiceConfigModel;
