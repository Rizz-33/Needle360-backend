import BaseUser from "../models/base-user.model.js";
import Conversation from "../models/conversation.model.js";

export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    if (participantId === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with self" });
    }

    const participant = await BaseUser.findById(participantId).select("_id");
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const existingConversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const conversation = await Conversation.create({
      participants: [userId, participantId],
      lastMessage: null,
      isGroup: false,
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "fullName email role profileImage")
      .lean();

    const io = req.app.get("io");
    io.to(userId.toString()).emit("newConversation", populatedConversation);
    io.to(participantId.toString()).emit(
      "newConversation",
      populatedConversation
    );

    return res.status(201).json(populatedConversation);
  } catch (error) {
    console.error(`Error creating conversation: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to create conversation", error: error.message });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const { participantIds, groupName } = req.body;
    const userId = req.user._id;

    if (
      !participantIds ||
      !Array.isArray(participantIds) ||
      participantIds.length < 1
    ) {
      return res
        .status(400)
        .json({ message: "At least one participant ID is required" });
    }

    if (participantIds.includes(userId.toString())) {
      return res
        .status(400)
        .json({ message: "Creator cannot be included in participant IDs" });
    }

    const participants = await BaseUser.find({
      _id: { $in: participantIds },
    }).select("_id");

    if (participants.length !== participantIds.length) {
      return res
        .status(404)
        .json({ message: "One or more participants not found" });
    }

    const allParticipants = [userId, ...participantIds];

    const existingGroup = await Conversation.findOne({
      participants: { $all: allParticipants, $size: allParticipants.length },
      isGroup: true,
    });

    if (existingGroup) {
      return res.status(200).json(existingGroup);
    }

    const conversation = await Conversation.create({
      participants: allParticipants,
      lastMessage: null,
      isGroup: true,
      groupName:
        groupName || `Group Chat ${new Date().toISOString().slice(0, 10)}`,
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "fullName email role profileImage")
      .lean();

    const io = req.app.get("io");
    allParticipants.forEach((participantId) => {
      io.to(participantId.toString()).emit(
        "newConversation",
        populatedConversation
      );
    });

    return res.status(201).json(populatedConversation);
  } catch (error) {
    console.error(`Error creating group conversation: ${error.message}`);
    return res
      .status(500)
      .json({
        message: "Failed to create group conversation",
        error: error.message,
      });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName email role profileImage")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json(conversations);
  } catch (error) {
    console.error(`Error fetching conversations: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to fetch conversations", error: error.message });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })
      .populate("participants", "fullName email role profileImage")
      .populate("lastMessage")
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error(`Error fetching conversation: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to fetch conversation", error: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Conversation.deleteOne({ _id: conversationId });

    const io = req.app.get("io");
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit(
        "conversationDeleted",
        conversationId
      );
    });

    return res
      .status(200)
      .json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error(`Error deleting conversation: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to delete conversation", error: error.message });
  }
};
