import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const password = encodeURIComponent(process.env.MONGODB_PASSWORD);

const connectionString = `mongodb+srv://risiniamarathunga:${password}@devcluster.4xxln.mongodb.net/database?retryWrites=true&w=majority&appName=DevCluster`;

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

export async function connectToMongoDB() {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB with Mongoose");
  } catch (e) {
    console.error("Error connecting to MongoDB:", e.message);
    process.exit(1);
  }
}
