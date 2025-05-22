import mongoose from "mongoose";
import BaseUser from "../models/base-user.model.js";
import Conversation from "../models/conversation.model.js";

export const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user?._id || req.userId;

    console.log("Request body:", req.body);
    console.log("User ID:", userId);
    console.log("Participant ID:", participantId);

    // Enhanced validation
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: "Invalid participant ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if trying to create conversation with self
    if (userId.toString() === participantId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    // Check if participant exists
    const participant = await BaseUser.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Check if user exists
    const user = await BaseUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, participantId], $size: 2 },
    })
      .populate({
        path: "participants",
        select: "name role",
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name",
        },
      });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, participantId],
        isGroup: false,
      });

      await conversation.save();

      // Populate the newly created conversation
      conversation = await Conversation.findById(conversation._id)
        .populate({
          path: "participants",
          select: "name role",
        })
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "name",
          },
        });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in createOrGetConversation:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;

    console.log("Getting conversations for user:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "name role",
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id || req.userId;

    console.log("Getting conversation:", conversationId, "for user:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res
        .status(400)
        .json({ message: "Invalid conversation ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: "participants",
        select: "name role",
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name",
        },
      });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "You don't have access to this conversation" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getConversationById:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const { title, participantIds } = req.body;
    const userId = req.user?._id || req.userId;

    console.log("Creating group conversation:", {
      title,
      participantIds,
      userId,
    });

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Enhanced validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ message: "Valid title is required" });
    }

    if (
      !participantIds ||
      !Array.isArray(participantIds) ||
      participantIds.length < 1
    ) {
      return res.status(400).json({
        message:
          "At least 1 other participant is required for a group conversation",
      });
    }

    // Validate all participant IDs
    const invalidIds = participantIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid participant ID format",
        invalidIds,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Create unique participant list (remove duplicates and ensure creator is included)
    const allParticipants = [
      ...new Set([
        userId.toString(),
        ...participantIds.map((id) => id.toString()),
      ]),
    ];

    // Check if all participants exist
    const participantsExist = await BaseUser.find({
      _id: { $in: allParticipants },
    }).countDocuments();

    if (participantsExist !== allParticipants.length) {
      return res
        .status(400)
        .json({ message: "One or more participants do not exist" });
    }

    const conversation = new Conversation({
      title: title.trim(),
      participants: allParticipants,
      isGroup: true,
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(
      conversation._id
    ).populate({
      path: "participants",
      select: "name role",
    });

    res.status(201).json(populatedConversation);
  } catch (error) {
    console.error("Error in createGroupConversation:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};
