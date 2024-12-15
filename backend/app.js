const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

app.listen(8085, () => {
  console.log("Server is running on port 8085");
});
