// mongodb-connection.js
const { MongoClient } = require('mongodb');

async function typhoonDbConnect() {
  const url = 'mongodb://localhost:27017'; // Replace with your MongoDB connection URL
  const dbName = 'mongoIemi';

  try {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}
module.exports={typhoonDbConnect}
