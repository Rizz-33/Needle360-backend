import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!content.trim()) {
      return res
        .status(400)
        .json({ message: "Message content cannot be empty" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this conversation" });
    }

    const message = new Message({
      sender: userId,
      content,
      conversation: conversationId,
      readBy: [userId],
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

    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this conversation" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("sender", "firstName lastName profilePicture role");

    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
    });

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      messages: messages.reverse(),
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
