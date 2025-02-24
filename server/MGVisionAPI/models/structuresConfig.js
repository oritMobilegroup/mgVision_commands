const mongoose = require('mongoose');
const crypto = require('crypto');
const { connectToMGVisionAPIDB } = require('../../config/db'); // Ensure this connects to the MGVisionAPI database

// Define the schema for the parameter configuration
const paramConfigSchema = new mongoose.Schema({
  IMEI: {
    type: String,
    required: true,
    unique: true
  },
  VersionId: { type:String, 
    required:true},
      Data: {
    ParamStructures: [
      {
        param_id: { type: Number, required: true },
        life_time: { type: Number, required: true },
        max_value: { type: Number, required: true },
        min_value: { type: Number, required: true },
        coefficient: { type: Number, required: true },
        routine_interval: { type: Number, required: true }
      }
    ],
    EventStructures: [
      {
        broadcastParamInterval: { type: Number },
        broadcast_parameters: { type: [Number], default: [] },
        event_id: { type: Number, required: true },
        status: { type: String, default: "Active" },
        isSendVideo: { type: Boolean, default: false },
        on_delay: { type: Number },
        off_delay: { type: Number },
        condition_type: { type: String },
        sendType: { type: String },
        event_conditions: {
          type: Map,
          of: String
        }
      }
    ]
  },
  md5: { type: String } // Field for storing the MD5 hash
}, { collection: 'structures_config_collection', versionKey: false });

let ParamConfig;

// Initialize the model
const initializeModel = async () => {
  try {
    const visionAPIConnection = await connectToMGVisionAPIDB();
    if (visionAPIConnection) {
      ParamConfig = visionAPIConnection.model('ParamConfig', paramConfigSchema);
      console.log('ParamConfig model created for MGVisionAPI');
    } else {
      console.error('Error initializing ParamConfig model: No MGVisionAPI connection');
    }
  } catch (error) {
    console.error('Error initializing ParamConfig model:', error);
    throw error;
  }
};

const getParamConfigModel = async () => {
  if (!ParamConfig) {
    await initializeModel();
  }
  return ParamConfig;
};

module.exports = getParamConfigModel;
