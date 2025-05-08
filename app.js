import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { handleStripeWebhook } from "./controllers/payment.controller.js";
import { connectToMongoDB } from "./db_connection.js";

// Routes imported from their respective files
import webhookRoutes from "./mailtrap/webhookController.js";
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
const requiredEnvVars = [
  "PORT",
  "CLIENT_URL",
  "MONGODB_PASSWORD",
  "STRIPE_SECRET_KEY",
  "JWT_SECRET",
];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const app = express();
const httpServer = http.createServer(app);

// Define allowed origins for CORS and Socket.IO
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://172.20.10.5",
  "http://13.61.16.74",
  "http://13.61.16.74",
  "http://needle360.online",
  "https://needle360.online",
  "http://www.needle360.online",
  "https://www.needle360.online",
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
].filter(Boolean);

// Socket.IO initialization
export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.some((allowed) =>
          typeof allowed === "string"
            ? allowed === origin
            : allowed.test(origin)
        )
      ) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinConversation", (conversationId) => {
    console.log(`Socket ${socket.id} joining conversation: ${conversationId}`);
    socket.join(conversationId);
  });

  socket.on("leaveConversation", (conversationId) => {
    console.log(`Socket ${socket.id} leaving conversation: ${conversationId}`);
    socket.leave(conversationId);
  });

  socket.on("joinRoom", ({ userId, role }) => {
    const room = `${role}:${userId}`;
    socket.join(room);
    console.log(`${role} ${userId} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const port = process.env.PORT || 4000;

// CORS configuration for HTTP requests
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.some((allowed) =>
          typeof allowed === "string"
            ? allowed === origin
            : allowed.test(origin)
        )
      ) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
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
    app.use("/api/mailtrap-webhook", webhookRoutes);

    // API health check
    app.get("/api", (req, res) => {
      res.json({ message: "API server is up and running" });
    });

    // Add this before httpServer.listen()
    app.get("/", (req, res) => {
      res.json({
        message: "Welcome to Needle360 Backend",
        api_docs: "http://13.61.16.74:4000/api",
        frontend: "http://13.61.16.74:5173",
      });
    });

    // Start the server
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Backend server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB. Server not started.", error);
    process.exit(1);
  });
