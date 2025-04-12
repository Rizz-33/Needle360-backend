import BaseUser from "../models/base-user.model.js";
import Conversation from "../models/conversation.model.js";

export const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const participant = await BaseUser.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

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
      conversation = new Conversation({
        participants: [userId, participantId],
        isGroup: false,
      });
      await conversation.save();

      conversation = await Conversation.findById(conversation._id).populate({
        path: "participants",
        select: "name role",
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in createOrGetConversation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
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

    if (
      !conversation.participants.some(
        (p) => p._id.toString() === userId.toString()
      )
    ) {
      return res
        .status(403)
        .json({ message: "You don't have access to this conversation" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getConversationById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const { title, participantIds } = req.body;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!title || !participantIds || participantIds.length < 2) {
      return res.status(400).json({
        message:
          "Group conversation requires a title and at least 2 other participants",
      });
    }

    const allParticipants = [
      ...new Set([userId.toString(), ...participantIds]),
    ];

    const participantsExist = await BaseUser.find({
      _id: { $in: allParticipants },
    }).countDocuments();

    if (participantsExist !== allParticipants.length) {
      return res
        .status(400)
        .json({ message: "One or more participants do not exist" });
    }

    const conversation = new Conversation({
      title,
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
