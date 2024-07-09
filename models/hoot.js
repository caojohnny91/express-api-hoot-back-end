// models/hoot.js
const mongoose = require("mongoose");

// this schema goes above the other schema that will be utilizing this schema
// We don’t need to compile the commentSchema into a model, or export it, as it is embedded inside the parent hootSchema. As a result, any functionality related to the comments resource will need to go through the Hoot first.
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const hootSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["News", "Sports", "Games", "Movies", "Music", "Television"],
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comments: [commentSchema],
  },
  { timestamps: true }
);

const Hoot = mongoose.model("Hoot", hootSchema);

module.exports = Hoot;
