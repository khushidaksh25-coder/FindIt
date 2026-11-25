
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Electronics",
        "Bags",
        "Documents",
        "Accessories",
        "Clothing",
        "Other"
      ]
    },

    status: {
      type: String,
      required: true,
      enum: ["Lost", "Found"]
    },

    location: {
      type: String,
      required: true,
      maxlength: 200
    },

    date: {
      type: Date,
      required: true
    },

    image: {
      type: String,
      default: ""
    },

    contactName: {
      type: String,
      required: true,
      maxlength: 100
    },

    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      maxlength: 254,
      select: false
    },

    // User who created this report
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;
