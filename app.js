const express = require("express");
const connectToMongoDB = require("./db_connection");

const app = express();
const port = 4000;

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
