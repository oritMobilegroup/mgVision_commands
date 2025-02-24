const mongoose = require('mongoose');
const { connectToMGVisionAPIDB } = require('../../config/db'); // Ensure this connects to the MGVisionAPI database

// Define the schema for the NFC configuration
const nfcConfigSchema = new mongoose.Schema({
  IMEI: {
    type: String,
    required: true,
    unique: true
  },
  VersionId: { type:String, 
    required:true},
  
  Data: {
    Style: { type: String, default: "allCodeOK" },
    BeepTimeout: { type: Number, default: 60 },
    WrongCodeLockDuration: { type: Number, default: 120 },
    HoldCodeValidationAccOff: { type: Number, default: 120 },
    WrongCodeCountBeforeLock: { type: Number, default: 5 },
    buzzerRateWrongCode: { type: Number, default: 5 },
    DriverCodes: {
      type: [String],
      default: []
    }
  },
  VersionId: { type:String, 
    required:true},
  md5: { type:String}
}, { collection: 'nfc_config_collection', versionKey: false }); // Explicitly define the collection name

let NFCConfig;

// Initialize the model
const initializeModel = async () => {
  try {
    const visionAPIConnection = await connectToMGVisionAPIDB();
    if (visionAPIConnection) {
      NFCConfig = visionAPIConnection.model('NFCConfig', nfcConfigSchema);
      console.log('NFCConfig model created for MGVisionAPI');
    } else {
      console.error('Error initializing NFCConfig model: No MGVisionAPI connection');
    }
  } catch (error) {
    console.error('Error initializing NFCConfig model:', error);
    throw error;
  }
};

const getNFCConfigModel = async () => {
  if (!NFCConfig) {
    await initializeModel();
  }
  return NFCConfig;
};

module.exports = getNFCConfigModel;



