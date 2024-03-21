// db.js or wherever you connect to the database

const mongoose = require('mongoose');
async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb+srv://oritmobile:213142771@cluster0.9kccieg.mongodb.net/ImeiMongo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports={connectToDatabase}
