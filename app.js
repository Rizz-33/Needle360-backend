import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectToMongoDB } from "./db_connection.js";
import authRoutes from "./routes/auth.route.js";
import itemRoutes from "./routes/item.route.js";
import tailorRoutes from "./routes/tailor.route.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(express.json()); // Body parser
app.use(cookieParser()); // Cookie parser

connectToMongoDB()
  .then((db) => {
    app.get("/", (req, res) => {
      res.send("Server is up and running");
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/tailor", tailorRoutes);
    app.use("/api/items", itemRoutes);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the MongoDB. Server not started.");
  });
