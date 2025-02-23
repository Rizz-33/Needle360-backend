import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  itemName: { type: String, required: true },
  description: { type: String },
  imageURLs: [{ type: String }],
  reviews: [{ username: String, comment: String, rating: Number }],
});

const Item = mongoose.model("Item", itemSchema);

export default Item;
