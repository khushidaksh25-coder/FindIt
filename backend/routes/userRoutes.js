
import express from "express";

import {
  registerUser,
  loginUser,
  getUserProfile
} from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// SIGN UP
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// PROTECTED PROFILE
router.get("/profile", authMiddleware, getUserProfile);

export default router;
