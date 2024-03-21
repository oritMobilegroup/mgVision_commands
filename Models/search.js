const IMEIModel = require('./IMEIModel');

async function searchIMEI(imei, callback, retries = 3) {
  try {
    const data = await IMEIModel.findOne({ imei }).exec();
    if (data) {
      callback(data);
    } else {
      callback('No data found for the provided IMEI.');
    }
  } catch (err) {
    console.error('Error searching for IMEI:', err);
    if (retries > 0) {
      // Retry the operation after a short delay
      setTimeout(() => {
        searchIMEI(imei, callback, retries - 1);
      }, 1000); // Adjust the delay as needed
    } else {
      callback('An error occurred.');
    }
  }
}

module.exports = searchIMEI;
