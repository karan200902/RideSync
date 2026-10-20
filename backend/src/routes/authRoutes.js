import express from "express";
import authenticate from "../middleware/authMiddleware.js";

import {
  register,
  login,
  refresh,
  logout,
  registerDriver,
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/driver/register", registerDriver);
router.get("/me", authenticate, getCurrentUser);
router.patch("/profile", authenticate, updateProfile);
router.patch("/change-password", authenticate, changePassword);

export default router;
