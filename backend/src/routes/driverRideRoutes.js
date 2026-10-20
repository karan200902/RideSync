import express from "express";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import {
  acceptRideRequest,
  startDriverArrivalRequest,
  markDriverArrivedRequest,
  startTripRequest,
  completeTripRequest,
  getActiveRideRequest,
  getAvailableRidesRequest,
  getDriverRidesRequest,
  getDriverEarningsRequest
} from "../controllers/rideController.js";

const router = express.Router();

router.use(authenticate, authorize("driver"));

router.get("/active", getActiveRideRequest);

router.get("/available", getAvailableRidesRequest);

router.patch("/:rideId/accept", acceptRideRequest);

router.patch("/:rideId/arriving", startDriverArrivalRequest);

router.patch("/:rideId/arrived", markDriverArrivedRequest);

router.patch("/:rideId/start", startTripRequest);

router.patch("/:rideId/complete", completeTripRequest);

router.get("/", getDriverRidesRequest);

router.get("/earnings", getDriverEarningsRequest);
export default router;
