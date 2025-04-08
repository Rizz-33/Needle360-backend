import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectToMongoDB } from "./db_connection.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import availabilityRoutes from "./routes/availability.route.js";
import designRoutes from "./routes/design.route.js";
import offerRoutes from "./routes/offer.route.js";
import serviceRoutes from "./routes/service.route.js";
import tailorRoutes from "./routes/tailor.route.js";
import userInteractionsRoutes from "./routes/user-interactions.route.js";

const app = express();
const port = process.env.PORT || 4000;

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Preflight request handling
app.options("*", (req, res) => {
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).send();
});

// Increase JSON payload size limit to 10MB
app.use(express.json({ limit: "16mb" })); // Body parser with increased limit
app.use(cookieParser()); // Cookie parser

// Connect to MongoDB and start the server
connectToMongoDB()
  .then((db) => {
    app.get("/", (req, res) => {
      res.send("Server is up and running");
    });

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/tailor", tailorRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/user-interactions", userInteractionsRoutes);
    app.use("/api/design", designRoutes);
    app.use("/api/offer", offerRoutes);
    app.use("/api/availability", availabilityRoutes);
    app.use("/api/services", serviceRoutes);

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the MongoDB. Server not started.");
  });
