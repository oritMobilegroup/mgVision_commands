/* jshint esversion: 9 */

const UserModel = require('./user');

async function saveData(data, callback) {
  // Create a new document with the extracted data and save it to the database
  const newData = new UserModel(data);

  try {
    const savedData = await newData.save();
    callback(null, savedData);
  } catch (err) {
    console.error('Error saving data:', err);
    callback(err, null);
  }
}

module.exports = {saveData};
