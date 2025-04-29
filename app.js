import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { handleStripeWebhook } from "./controllers/payment.controller.js";
import { connectToMongoDB } from "./db_connection.js";

// Routes
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import availabilityRoutes from "./routes/availability.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import customerRoutes from "./routes/customer.route.js";
import designRoutes from "./routes/design.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import messageRoutes from "./routes/message.route.js";
import offerRoutes from "./routes/offer.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import serviceRoutes from "./routes/service.route.js";
import tailorRoutes from "./routes/tailor.route.js";
import userInteractionsRoutes from "./routes/user-interactions.route.js";

dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ["PORT", "CLIENT_URL"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

// Define allowed origins for CORS and Socket.IO
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://13.61.16.74:5173",
  "http://13.61.16.74:4000",
  "http://localhost:5173", // For local development
].filter(Boolean); // Remove undefined or null values

// Socket.IO initialization
export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl) or from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a conversation room
  socket.on("joinConversation", (conversationId) => {
    console.log(`Socket ${socket.id} joining conversation: ${conversationId}`);
    socket.join(conversationId);
  });

  // Leave a conversation room
  socket.on("leaveConversation", (conversationId) => {
    console.log(`Socket ${socket.id} leaving conversation: ${conversationId}`);
    socket.leave(conversationId);
  });

  // Join rooms for tailor and customer
  socket.on("joinRoom", ({ userId, role }) => {
    const room = `${role}:${userId}`;
    socket.join(room);
    console.log(`${role} ${userId} joined room: ${room}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const port = process.env.PORT || 4000;

// CORS configuration for HTTP requests
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin or from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Preflight request handling
app.options("*", cors());

// Parse JSON bodies
app.use(express.json({ limit: "16mb" }));

// Parse raw bodies for Stripe webhook
app.use(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(cookieParser());

// Connect MongoDB and start server
connectToMongoDB()
  .then(() => {
    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/tailor", tailorRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/user-interactions", userInteractionsRoutes);
    app.use("/api/design", designRoutes);
    app.use("/api/offer", offerRoutes);
    app.use("/api/availability", availabilityRoutes);
    app.use("/api/services", serviceRoutes);
    app.use("/api/customer", customerRoutes);
    app.use("/api/conversations", conversationRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/review", reviewRoutes);
    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/order", orderRoutes);

    // Serve static files from the frontend build directory
    const frontendBuildPath = path.join(__dirname, "../frontend/dist");
    app.use(express.static(frontendBuildPath));

    // API health check endpoint
    app.get("/api", (req, res) => {
      res.json({ message: "API server is up and running" });
    });

    // Handle all other requests with the React app
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendBuildPath, "index.html"));
    });

    // Start HTTP + Socket.IO server
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Serving frontend from ${frontendBuildPath}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB. Server not started.", error);
    process.exit(1);
  });
