import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectToMongoDB } from "./db_connection.js";

// Routes
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import availabilityRoutes from "./routes/availability.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import customerRoutes from "./routes/customer.route.js";
import designRoutes from "./routes/design.route.js";
import messageRoutes from "./routes/message.route.js";
import offerRoutes from "./routes/offer.route.js";
import reviewRoutes from "./routes/review.route.js";
import serviceRoutes from "./routes/service.route.js";
import tailorRoutes from "./routes/tailor.route.js";
import userInteractionsRoutes from "./routes/user-interactions.route.js";

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

app.use(express.json({ limit: "16mb" }));
app.use(cookieParser());

// Connect MongoDB and start
connectToMongoDB()
  .then(() => {
    app.get("/", (req, res) => {
      res.send("Server is up and running");
    });

    // Route usage
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

    // Start HTTP + Socket.IO server
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB. Server not started.");
  });
