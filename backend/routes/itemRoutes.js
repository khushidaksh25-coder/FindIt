
import express from "express";

import {
  createItem,
  getItems,
  getItemById,
  getOwnedItemDetails,
  updateItem,
  deleteItem
} from "../controllers/itemController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// POST - Create item (Login required)
router.post("/", authMiddleware, createItem);

// GET - Get all items (Public)
router.get("/", getItems);

// GET - Get single item (Public)
router.get("/:id", getItemById);

// GET - Get private item details for the owner
router.get("/:id/private", authMiddleware, getOwnedItemDetails);

// PUT - Update item (Login required)
router.put("/:id", authMiddleware, updateItem);

// DELETE - Delete item (Login required)
router.delete("/:id", authMiddleware, deleteItem);

export default router;
