const mongoose = require('mongoose');
const { connectToMGVisionAPIDB } = require('../../config/db'); // Ensure this connects to MGVisionAPI DB

const unitChangeSchema = new mongoose.Schema({
    IMEI: { type: String, required: true, index: true }, // Indexed for faster lookups
    OldData: { type: Object, default: {} }, // Default empty object to prevent errors
    NewData: { type: Object, default: {} },
    Changes: { type: Object, default: {} }, 
    Timestamp: { type: Date, default: Date.now }
}, { collection: 'diffGeneral', versionKey: false }); // Explicit collection name

// Use MGVisionAPI connection
let DiffGeneral;

const initializeModel = async () => {
    try {
        const visionAPIConnection = await connectToMGVisionAPIDB();
        if (visionAPIConnection) {
            DiffGeneral = visionAPIConnection.model('diffGeneral', unitChangeSchema);
            console.log('DiffGeneral model initialized in MGVisionAPI');
        } else {
            console.error(' Error initializing DiffGeneral model: No MGVisionAPI connection');
        }
    } catch (error) {
        console.error(' Error initializing DiffGeneral model:', error);
        throw error;
    }
};

// Function to return the initialized model
const getDiffGeneralModel = async () => {
    if (!DiffGeneral) {
        await initializeModel();
    }
    return DiffGeneral;
};

module.exports = getDiffGeneralModel;
