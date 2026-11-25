
import Item from "../models/item.js";
import mongoose from "mongoose";
import { validateItemInput } from "../utils/itemValidation.js";

// 1. CREATE ITEM - POST
export const createItem = async (req, res) => {
  try {
    const { data, error } = validateItemInput(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const newItem = await Item.create({
      ...data,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Item added successfully!",
      data: newItem
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Report data is invalid."
      });
    }
    console.error("Report creation failed.");
    res.status(500).json({
      success: false,
      message: "Unable to create report."
    });
  }
};


// 2. GET ALL ITEMS - GET
export const getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .select("-contactEmail")
      .populate("user", "name");

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    console.error("Report listing failed.");
    res.status(500).json({
      success: false,
      message: "Unable to load reports."
    });
  }
};


// 3. GET SINGLE ITEM - GET BY ID
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    const item = await Item.findById(id)
      .select("-contactEmail")
      .populate("user", "name");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error("Report lookup failed.");
    res.status(500).json({
      success: false,
      message: "Unable to load report."
    });
  }
};

export const getOwnedItemDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    const item = await Item.findOne({
      _id: id,
      user: req.user.id
    })
      .select("+contactEmail")
      .populate("user", "name");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you are not authorized to view it"
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch {
    console.error("Private report lookup failed.");
    res.status(500).json({
      success: false,
      message: "Unable to load report."
    });
  }
};


// 4. UPDATE ITEM - PUT
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    const { data: updateData, error } = validateItemInput(req.body, { partial: true });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const updatedItem = await Item.findOneAndUpdate(
      {
        _id: id,
        user: req.user.id
      },
      {
        $set: updateData
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you are not authorized to update it"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item updated successfully!",
      data: updatedItem
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Report data is invalid."
      });
    }
    console.error("Report update failed.");
    res.status(500).json({
      success: false,
      message: "Unable to update report."
    });
  }
};


// 5. DELETE ITEM - DELETE
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    const deletedItem = await Item.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you are not authorized to delete it"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item deleted successfully!",
      data: deletedItem
    });

  } catch (error) {
    console.error("Report deletion failed.");
    res.status(500).json({
      success: false,
      message: "Unable to delete report."
    });
  }
};
