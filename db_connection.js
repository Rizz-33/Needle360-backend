import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
const connectionString = `mongodb+srv://risiniamarathunga:${password}@devcluster.4xxln.mongodb.net/?retryWrites=true&w=majority&appName=DevCluster`;

const client = new MongoClient(connectionString);

export async function connectToMongoDB() {
  try {
    await client.connect();
    const db = client.db("Rizz-33");
    console.log("Connected to MongoDB");
    return db;
  } catch (e) {
    console.error("Error connecting to MongoDB:", e.message);
    process.exit(1);
  }
}
