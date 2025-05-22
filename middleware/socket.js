import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import BaseUser from "../models/base-user.model.js";

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"], // Explicitly set transports
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log("No token provided");
        return next(new Error("Authentication error: Token not provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        console.log("Invalid token");
        return next(new Error("Authentication error: Invalid token"));
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
        console.log("User not found");
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      console.log(`Authenticated user: ${user._id}`);
      next();
    } catch (error) {
      console.error("Socket middleware error:", error);
      next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    socket.join(socket.user._id.toString());

    // Join conversation event (matches client event name)
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.user._id} joined conversation: ${conversationId}`
      );
    });

    // Leave conversation event
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(
        `User ${socket.user._id} left conversation: ${conversationId}`
      );
    });

    // New message event
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
        console.error("Error broadcasting message:", error);
      }
    });

    // Mark messages as read
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
        console.error("Error marking messages as read:", error);
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
