import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export async function connectToMongoDB() {
  try {
    // Use the local MongoDB connection string from your .env
    const connectionString =
      process.env.MONGODB_CONNECTION_STRING ||
      `mongodb+srv://risiniamarathunga:${encodeURIComponent(
        process.env.MONGODB_PASSWORD
      )}@devcluster.4xxln.mongodb.net/database?retryWrites=true&w=majority`;

    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });
    console.log("Connected to MongoDB with Mongoose");
  } catch (e) {
    console.error("Error connecting to MongoDB:", e.message);
    process.exit(1);
  }
}
