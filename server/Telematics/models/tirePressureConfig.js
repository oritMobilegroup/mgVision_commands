/* jshint version: 9 */
const mongoose = require('mongoose');
const { connectToTelematicsDB } = require('../../config/db');

// Define the schema
const sensorSchema = new mongoose.Schema(
  {
    imei: {
      type: String,
      required: true,
      unique: true
    },
    TirePressure: {
      SendTireRateAccOn: Number,
      SendTireRateAccOff: Number,
      ALeftIn: String,
      ALeftOut: String,
      BLeftIn: String,
      BLeftOut: String,
      CLeftIn: String,
      CLeftOut: String,
      DLeftIn: String,
      DLeftOut: String,
      ELeftIn: String,
      ELeftOut: String,
      ARightIn: String,
      ARightOut: String,
      BRightIn: String,
      BRightOut: String,
      CRightIn: String,
      CRightOut: String,
      DRightIn: String,
      DRightOut: String,
      ERightIn: String,
      ERightOut: String
    },
    md5: {
      type: String,
    },
    VersionId: { type:String, 
      required:true
    }
  },


  
  { collection: 'TirePressureConfig', versionKey: false }
);

// Export the model as before
let TirePressureConfig;

const initializeModel = async () => {
  try {
    const telematicsConnection = await connectToTelematicsDB();
    if (telematicsConnection) {
        TirePressureConfig = telematicsConnection.model('TirePressureConfig', sensorSchema);
      console.log('TirePressureConfig model created for TelematicsDB');
    } else {
      console.error('Error initializing TirePressureConfig model: No TelematicsDB connection');
    }
  } catch (error) {
    console.error('Error initializing TirePressureConfig model:', error);
    throw error;
  }
};

const getMGServiceConfigModel = async () => {
  if (!TirePressureConfig) {
    await initializeModel();
  }
  return TirePressureConfig;
};

module.exports = getMGServiceConfigModel;
