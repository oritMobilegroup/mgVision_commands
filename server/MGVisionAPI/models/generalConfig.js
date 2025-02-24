const mongoose = require('mongoose');
const { connectToMGVisionAPIDB } = require('../../config/db'); // Ensure this connects to the MGVisionAPI database

const generalConfigSchema = new mongoose.Schema({
  IMEI: {
    type: String,
    required: true,
    unique: true
  },
  ConfigID: {
    type: String,
    default: "01"
  },
  VersionId: { type:String, 
    required:true},
    md5: {
      type: String
    },
  
  Data: {
    ActiveModules: {
      Adas: { type: Number, default: 1},
      CAN: { type: Number, default:1},
      Dms: { type: Number, default: 1 },
      GpsOdometer: { type: Number, default: 1 },
      Gsensor: { type: Number, default: 1 },
      NFC: { type: Number, default: 0 },
      Temperature: { type: Number, default: 1 },
      TirePressure: { type: Number, default: 1 },
      TruckWeight:{ type: Number, default:1}

    
    },
    CAN: {
      OBD_Baudrate: { type: Number, default: 500 },
      Type: { type: String, default: "J1939" }
    },
    RecordingSettings:{
      DriverCam:{
        isActiveRecord:{type:Number, default:1},
        CompressionType:{type:String, default:"mid"},
        Resolution:{type:String,default:"low"}

      },
      FrontCam:{
        isActiveRecord:{type:Number, default:1},
        CompressionType:{type:String, default:"low"},
        Resolution:{type:String,default:"high"}
      },
      SideCamLeft:{
        isActiveRecord:{type:Number, default:0},
        CompressionType:{type:String, default:"mid"},
        Resolution:{type:String,default:"mid"}
      },
      SideCamRight:{
        isActiveRecord:{type:Number, default:0},
        CompressionType:{type:String, default:"mid"},
        Resolution:{type:String,default:"mid"}
      }
    },
    GsensorConfiguration: {
      AxisAcc: { type: String, default: "X+" },
      AxisCornerRight: { type: String, default: "Y+" },
      HarshCornerRightLow: { type: Number, default: 0.4 },
      HarshCornerRightMid: { type: Number, default: 0.5 },
      HarshCornerRightHigh: { type: Number, default: 0.6 },
      HarshBrakingLow: { type: Number, default: 0.4 },
      HarshBrakingMid: { type: Number, default: 0.5 },
      HarshBrakingHigh: { type: Number, default: 0.6 },
      SuddenAccMid: { type: Number, default: 0.45 },
      SuddenAccHigh: { type: Number, default: 0.5 },
      NormalThreshold: { type: Number, default: 1 },
      QuantitySamplesEvent: { type: Number, default: 4 },
      DefaultX: { type: Number, default: -0.078999996 },
      DefaultY: { type: Number, default: 0.037875 },
      DefaultZ:{ type: Number, default:0}
    },
    GPS: {
      SendGpsAccOn: { type: Number, default: 5 },
      SendGpsAccOff: { type: Number, default: 3600 },
      GpsAzimuth: { type: Number, default: 30 }
    },
      
    PowerOffSetting: {
      PowerOffDelayDefault: { type: Number, default: 3600 },
      ShutdownAndRebootDelayTime: { type: Number, default: 60 }
    },
    Temperature: {
      FrontSensorMac: { type: String, default: "" },
      RearSensorMac: { type: String, default: "" },
      SendTempRateAccOn: { type: Number, default: 5 },
      SendTempRateAccOff: { type: Number, default: 10 }
    },
    TirePressure: {
      ALeftIn: { type: String, default: "" },
      ALeftOut: { type: String, default: "" },
      ARightIn:{ type: String, default: "0"},
      ARightOut:{ type: String, default: "0"},
      BLeftIn: { type: String, default: "" },
      BLeftOut: { type: String, default: "" },
      BRightIn: { type: String, default: "" },
      BRightOut: { type: String, default: "" },
      CLeftIn:{type:String,default:""},
      CRightIn:{type:String,default:""},
      CRightOut:{type:String,default:""},
      DLeftIn:{type:String,default:""},
      DLeftOut:{type:String,default:""},
      DRightOut:{type:String,default:""},
      ELeftIn:{type:String,default:""},
      ELeftOut:{type:String,default:""},
      ERightIn:{type:String,default:""},
      ERightOut:{type:String,default:""},   
      SendTireRateAccOn: { type: Number, default: 60 },
      SendTireRateAccOff: { type: Number, default: 0 },
    },
  TruckWeight: {
    macTruck: { type: String, default: "" },
    SendTempRateAccOn: { type: Number, default: 60000 },
    SendTempRateAccOff: { type: Number, default: 120000 }
}


},
  
  
}
 ,{ collection: 'generalconfigs', versionKey: false }); // Explicitly define the collection name

// Model initialization
let GeneralConfig;

const initializeModel = async () => {
  try {
    const visionAPIConnection = await connectToMGVisionAPIDB();
    if (visionAPIConnection) {
      GeneralConfig = visionAPIConnection.model('GeneralConfig', generalConfigSchema);
      console.log('GeneralConfig model created for MGVisionAPI');
    } else {
      console.error('Error initializing GeneralConfig model: No MGVisionAPI connection');
    }
  } catch (error) {
    console.error('Error initializing GeneralConfig model:', error);
    throw error;
  }
};

const getGeneralConfigModel = async () => {
  if (!GeneralConfig) {
    await initializeModel();
  }
  return GeneralConfig;
};

module.exports = getGeneralConfigModel;
