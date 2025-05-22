import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import BaseUser from "../models/base-user.model.js";

const initializeSocketServer = (server) => {
  const allowedOrigins = [
    "https://needle360.online",
    "http://www.needle360.online",
    "https://www.needle360.online",
    "http://localhost:5173",
    "http://172.20.10.5",
    "http://13.61.16.74",
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  ].filter(Boolean);

  const io = new Server(server, {
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
          console.warn(`Blocked Socket.IO CORS request from origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];
      if (!token) {
        console.log("No token provided in Socket.IO handshake");
        return next(new Error("Authentication error: Token not provided"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.log("Invalid or expired token:", err.message);
        return next(
          new Error("Authentication error: Invalid or expired token")
        );
      }

      const userId = decoded.userId || decoded.id || decoded._id;
      if (!userId) {
        console.log("No user ID in token");
        return next(
          new Error("Authentication error: User ID not found in token")
        );
      }

      const user = await BaseUser.findById(userId).select("-password");
      if (!user) {
        console.log("User not found for ID:", userId);
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      console.log(`Authenticated Socket.IO user: ${user._id}`);
      next();
    } catch (error) {
      console.error("Socket.IO middleware error:", error.message);
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    socket.join(socket.user._id.toString());

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.user._id} joined conversation: ${conversationId}`
      );
    });

    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(
        `User ${socket.user._id} left conversation: ${conversationId}`
      );
    });

    socket.on("newMessage", async (message) => {
      try {
        const conversation = await Conversation.findById(message.conversation);
        if (
          !conversation ||
          !conversation.participants.includes(socket.user._id)
        ) {
          return socket.emit("error", "Not authorized for this conversation");
        }
        io.to(message.conversation).emit("newMessage", message);
      } catch (error) {
        console.error("Error broadcasting message:", error.message);
        socket.emit("error", `Failed to broadcast message: ${error.message}`);
      }
    });

    socket.on("markMessagesAsRead", async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversation: conversationId,
            readBy: { $ne: socket.user._id },
          },
          { $addToSet: { readBy: socket.user._id } }
        );

        io.to(conversationId).emit("messagesRead", {
          conversationId,
          readBy: socket.user._id,
          messageIds,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error.message);
        socket.emit(
          "error",
          `Failed to mark messages as read: ${error.message}`
        );
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  return io;
};

export default initializeSocketServer;
