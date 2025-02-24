/* jshint version: 9 */
const mongoose = require('mongoose');
const { connectToTelematicsDB } = require('../../config/db');

// Define the schema
const thermalSensorsSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true
  },
  macList: {
    type: [String],
    required: true
  },
  md5: {
    type: String,
  },
  VersionId: { type:String, 
    required:true}
 
}, { collection: 'thermalSensors' , versionKey: false});  // Explicitly define the collection name

// Export a function that returns the initialized model
let ThermalSensor;

const initializeModel = async () => {
  try {
    const telematicsConnection = await connectToTelematicsDB();
    if (telematicsConnection) {
      if (!ThermalSensor) {

      ThermalSensor = telematicsConnection.model('ThermalSensor', thermalSensorsSchema);
         console.log('ThermalSensor model created for TelematicsDB');
      }
    } else {
      console.error('Error initializing ThermalSensor model: No TelematicsDB connection');
    }
  } catch (error) {
    console.error('Error initializing ThermalSensor model:', error);
    throw error;
  }
};

const getThermalSensorModel = async () => {
  if (!ThermalSensor) {
    await initializeModel();
  }
  return ThermalSensor;
};

module.exports = getThermalSensorModel;
