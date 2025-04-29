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

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

// Socket.IO initialization
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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

// CORS
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

// Parse JSON bodies
app.use(express.json({ limit: "16mb" }));

// Parse raw bodies for Stripe webhook
app.use(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(cookieParser());

// Connect MongoDB and start
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
    // Update the path to where your React build files are located
    const frontendBuildPath = path.join(__dirname, "../frontend/dist");
    app.use(express.static(frontendBuildPath));

    // API health check endpoint
    app.get("/api", (req, res) => {
      res.send("API server is up and running");
    });

    // Handle all other requests with the React app
    // This must be after API routes to avoid catching API calls
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendBuildPath, "index.html"));
    });

    // Start HTTP + Socket.IO server
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Serving frontend from ${frontendBuildPath}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB. Server not started.", error);
  });
