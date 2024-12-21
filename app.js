import express from "express";
import { connectToMongoDB } from './db_connection.js';

const app = express();
const port = 4003;

connectToMongoDB()
  .then((db) => {
    app.get("/", (req, res) => {
      res.send("Server is up and running");
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the MongoDB. Server not started.");
  });
