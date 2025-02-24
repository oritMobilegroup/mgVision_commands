const mongoose = require('mongoose');

const unitChangeSchema = new mongoose.Schema({
    IMEI: { type: String, required: true, index: true }, // Index added for faster lookups
    OldData: { type: Object, default: {} }, // Default empty object to prevent errors
    NewData: { type: Object, default: {} },
    Changes: { type: Object, default: {} }, 
    Timestamp: { type: Date, default: Date.now }
}, { collection: 'diffGeneral', versionKey: false }); // Explicit collection name

const diffGeneral = mongoose.model('diffGeneral', unitChangeSchema);
module.exports = diffGeneral;
