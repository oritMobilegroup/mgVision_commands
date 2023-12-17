
/* jshint esversion: 9 */

const mongoose = require('mongoose');
async function connectToDatabase() {
  try {

  

    // `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.gqlsu.mongodb.net/?retryWrites=true&w=majority/${process.env.MONGO_DBNAME}`
    //mongodb+srv://oritmobile:213142771@cluster0.9kccieg.mongodb.net/ImeiMongo
    //mongodb+srv://mgvision_user:Al2RiNwQ0RTdcrwK@iridium-mg.gqlsu.mongodb.net/?retryWrites=true&w=majority/MGvisionCommands", {
      // useNewUrlParser: true,
    await mongoose.connect("mongodb+srv://mgvision_user:Al2RiNwQ0RTdcrwK@iridium-mg.gqlsu.mongodb.net/MGvisionCommands", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports={connectToDatabase};
