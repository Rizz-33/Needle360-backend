import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import BaseUser from "../models/base-user.model.js"; // Changed from User to BaseUser
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const verifyJWT = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.verify(token, secret);
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
};

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      const decoded = verifyJWT(token);
      if (!decoded) {
        return next(new Error("Authentication error: Invalid token"));
      }

      const userId = decoded.userId || decoded.id || decoded._id;
      if (!userId) {
        return next(
          new Error("Authentication error: User ID not found in token")
        );
      }

      const user = await BaseUser.findById(userId).select("-password"); // Changed from User to BaseUser
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user._id}`);

    socket.join(socket.user._id.toString());

    socket.broadcast.emit("user_status_changed", {
      userId: socket.user._id,
      status: "online",
    });

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.user._id} joined conversation: ${conversationId}`
      );
    });

    socket.on("send_message", async (messageData) => {
      try {
        const { conversationId, content } = messageData;

        const newMessage = new Message({
          sender: socket.user._id,
          content,
          conversation: conversationId,
          readBy: [socket.user._id],
        });

        const savedMessage = await newMessage.save();

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: savedMessage._id,
          $inc: { messageCount: 1 },
        });

        const populatedMessage = await Message.findById(
          savedMessage._id
        ).populate("sender", "firstName lastName profilePicture role");

        io.to(conversationId).emit("receive_message", populatedMessage);

        const conversation = await Conversation.findById(
          conversationId
        ).populate("participants", "_id");

        conversation.participants.forEach((participant) => {
          if (participant._id.toString() !== socket.user._id.toString()) {
            io.to(participant._id.toString()).emit("new_message_notification", {
              conversationId,
              message: populatedMessage,
            });
          }
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: error.message });
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("user_typing", {
        userId: socket.user._id,
        isTyping,
      });
    });

    socket.on("mark_as_read", async ({ conversationId }) => {
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.user._id },
            readBy: { $ne: socket.user._id },
          },
          { $addToSet: { readBy: socket.user._id } }
        );

        socket.to(conversationId).emit("messages_read", {
          conversationId,
          readBy: socket.user._id,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user._id}`);
      socket.broadcast.emit("user_status_changed", {
        userId: socket.user._id,
        status: "offline",
      });
    });
  });

  return io;
};

export default initializeSocketServer;
