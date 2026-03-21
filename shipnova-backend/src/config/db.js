const mongoose = require("mongoose");

let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  if (cachedConnection || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGO_URI);
    cachedConnection = await connectionPromise;
    return cachedConnection;
  } catch (error) {
    console.log(error);
    connectionPromise = null;
    throw error;
  }
};

module.exports = connectDB;