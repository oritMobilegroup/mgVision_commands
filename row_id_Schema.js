const mongoose = require('mongoose');

const rowIdSchema = new mongoose.Schema({

    rowIdTracker: Number,
    rowIdTracker_ACC_ON: String,
    rowIdTracker_ACC_OFF: String,

    rowIdTracker_Shock: String,
    rowIdTracker_Power_Cut: String,

});
const RowId = mongoose.model('RowId', rowIdSchema);

module.exports = RowId;

