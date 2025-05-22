import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

// In your message.controller.js
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, attachments = [], clientId } = req.body;
    const userId = req.user?._id || req.userId;

    // ... (existing validation code)

    const message = new Message({
      sender: userId,
      content,
      conversation: conversationId,
      readBy: [userId],
      attachments: attachments || [],
      clientId,
    });

    const savedMessage = await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: savedMessage._id,
      $inc: { messageCount: 1 },
    });

    const populatedMessage = await Message.findById(savedMessage._id).populate(
      "sender",
      "firstName lastName profilePicture role"
    );

    if (clientId) {
      populatedMessage._doc.clientId = clientId;
    }

    // Use the injected io instance
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("newMessage", populatedMessage);
    } else {
      console.error("Socket.io instance not available");
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this conversation" });
    }

    // Get total count first
    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
    });

    // Calculate skip for standard pagination
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 }) // Sort by oldest first
      .skip(skip)
      .limit(limitNum)
      .populate("sender", "firstName lastName profilePicture role");

    // Mark messages as read, but don't wait for the operation to complete
    // before sending response
    Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    )
      .then((updateResult) => {
        if (updateResult.modifiedCount > 0) {
          // Find the messages that were just marked as read
          Message.find({
            conversation: conversationId,
            sender: { $ne: userId },
            readBy: userId,
            _id: { $in: messages.map((msg) => msg._id) },
          }).then((updatedMessages) => {
            // Emit read receipt event
            const io = req.app.get("io");
            if (io) {
              io.to(conversationId).emit("messagesRead", {
                conversationId,
                readBy: userId,
                messageIds: updatedMessages.map((msg) => msg._id),
              });
            }
          });
        }
      })
      .catch((err) => {
        console.error("Error updating message read status:", err);
      });

    res.status(200).json({
      messages,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalMessages / limitNum),
        totalMessages,
      },
    });
  } catch (error) {
    console.error("Error in getConversationMessages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find all unread messages sent by others
    const unreadMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });

    let updatedCount = 0;

    if (unreadMessages.length > 0) {
      // Add current user to readBy array
      const updateResult = await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
        { $addToSet: { readBy: userId } }
      );

      updatedCount = updateResult.modifiedCount;

      // Emit read receipt event to all clients in this conversation
      const io = req.app.get("io");
      if (io) {
        io.to(conversationId).emit("messagesRead", {
          conversationId,
          readBy: userId,
          messageIds: unreadMessages.map((msg) => msg._id),
        });
      }
    }

    res.status(200).json({
      success: true,
      count: updatedCount,
      messageIds: unreadMessages.map((msg) => msg._id),
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    const conversation = await Conversation.findById(message.conversation);

    if (
      conversation.lastMessage &&
      conversation.lastMessage.toString() === messageId
    ) {
      const previousMessage = await Message.findOne({
        conversation: conversation._id,
        _id: { $ne: messageId },
      }).sort({ createdAt: -1 });

      if (previousMessage) {
        conversation.lastMessage = previousMessage._id;
      } else {
        conversation.lastMessage = null;
      }

      conversation.messageCount = Math.max(0, conversation.messageCount - 1);
      await conversation.save();
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
