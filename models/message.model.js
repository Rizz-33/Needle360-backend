import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser", // Changed from "User" to "BaseUser"
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BaseUser", // Changed from "User" to "BaseUser"
      },
    ],
    attachments: [
      {
        url: String,
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    clientId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
