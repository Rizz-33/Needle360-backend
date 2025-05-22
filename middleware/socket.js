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
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];
      if (!token) {
        console.error("Socket.IO: No token provided");
        return next(new Error("Authentication error: No token provided"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.error(`Socket.IO: Invalid token - ${err.message}`);
        return next(
          new Error(`Authentication error: Invalid or expired token`)
        );
      }

      const userId = decoded.userId || decoded.id || decoded._id;
      if (!userId) {
        console.error("Socket.IO: No user ID in token");
        return next(
          new Error("Authentication error: User ID not found in token")
        );
      }

      const user = await BaseUser.findById(userId).select("-password").lean();
      if (!user) {
        console.error(`Socket.IO: User not found for ID ${userId}`);
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      console.log(`Socket.IO: Authenticated user ${user._id}`);
      next();
    } catch (error) {
      console.error(`Socket.IO middleware error: ${error.message}`);
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket.IO: User connected ${socket.user._id}`);
    socket.join(socket.user._id.toString());

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `Socket.IO: User ${socket.user._id} joined conversation ${conversationId}`
      );
    });

    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(
        `Socket.IO: User ${socket.user._id} left conversation ${conversationId}`
      );
    });

    socket.on("newMessage", async (message) => {
      try {
        io.to(message.conversation).emit("newMessage", message);
      } catch (error) {
        console.error(
          `Socket.IO: Error broadcasting message - ${error.message}`
        );
        socket.emit("error", `Failed to broadcast message: ${error.message}`);
      }
    });

    socket.on("markMessagesAsRead", async ({ conversationId, messageIds }) => {
      try {
        io.to(conversationId).emit("messagesRead", {
          conversationId,
          readBy: socket.user._id,
          messageIds,
        });
      } catch (error) {
        console.error(
          `Socket.IO: Error broadcasting read status - ${error.message}`
        );
        socket.emit(
          "error",
          `Failed to broadcast read status: ${error.message}`
        );
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket.IO: User disconnected ${socket.user._id}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket.IO: Client error - ${error.message}`);
    });
  });

  return io;
};

export default initializeSocketServer;
