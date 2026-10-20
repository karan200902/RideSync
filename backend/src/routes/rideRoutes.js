import express from "express";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import {
  cancelRideRequest,
  createRideRequest,
  getMyRides,
  getRide,
  createPaymentRequest,
} from "../controllers/rideController.js";

const router = express.Router();

router.use(authenticate, authorize("passenger"));

router.post("/", createRideRequest);
router.get("/:rideId", getRide);
router.get("/", getMyRides);
router.patch("/:rideId/cancel", cancelRideRequest);
router.post("/:rideId/payment", createPaymentRequest);
export default router;
