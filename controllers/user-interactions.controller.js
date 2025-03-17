import mongoose from "mongoose";

export const followUser = async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(followerId) ||
      !mongoose.Types.ObjectId.isValid(followeeId)
    ) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (followerId === followeeId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const db = mongoose.connection.db;

    const follower = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(followerId) });
    const followee = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(followeeId) });

    if (!follower || !followee) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(followerId),
      following: new mongoose.Types.ObjectId(followeeId),
    });

    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(followerId) },
        { $push: { following: new mongoose.Types.ObjectId(followeeId) } }
      );

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(followeeId) },
        { $push: { followers: new mongoose.Types.ObjectId(followerId) } }
      );

    res.status(200).json({ message: "Successfully followed user" });
  } catch (error) {
    console.error("Error following user:", error);
    res
      .status(500)
      .json({ message: "Error following user", error: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(followerId) ||
      !mongoose.Types.ObjectId.isValid(followeeId)
    ) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const db = mongoose.connection.db;

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(followerId) },
        { $pull: { following: new mongoose.Types.ObjectId(followeeId) } }
      );

    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(followeeId) },
        { $pull: { followers: new mongoose.Types.ObjectId(followerId) } }
      );

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res
      .status(500)
      .json({ message: "Error unfollowing user", error: error.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const db = mongoose.connection.db;

    const user = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followerIds = user.followers || [];
    const followers = await db
      .collection("users")
      .find(
        {
          _id: {
            $in: followerIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
        { projection: { name: 1, email: 1, shopName: 1, logoUrl: 1, role: 1 } }
      )
      .toArray();

    res.status(200).json(followers);
  } catch (error) {
    console.error("Error getting followers:", error);
    res
      .status(500)
      .json({ message: "Error getting followers", error: error.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const db = mongoose.connection.db;

    const user = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingIds = user.following || [];
    const following = await db
      .collection("users")
      .find(
        {
          _id: {
            $in: followingIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
        { projection: { name: 1, email: 1, shopName: 1, logoUrl: 1, role: 1 } }
      )
      .toArray();

    res.status(200).json(following);
  } catch (error) {
    console.error("Error getting following:", error);
    res
      .status(500)
      .json({ message: "Error getting following", error: error.message });
  }
};
