import express from "express";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import { getCurrentUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getCurrentUser);

router.get(
  "/passenger-test",
  authenticate,
  authorize("passenger"),
  getCurrentUser,
);

router.get("/driver-test", authenticate, authorize("driver"), getCurrentUser);

router.get("/admin-test", authenticate, authorize("admin"), getCurrentUser);

export default router;
