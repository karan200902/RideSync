import express from "express";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import {
  getAdminOverview,
  getAllDrivers,
  getAllRides,
  getAllUsers,
  getPendingDrivers,
  updateDriverVerification,
} from "../controllers/adminController.js";
import { getAllPayments } from "../controllers/paymentController.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/drivers", getPendingDrivers);

router.patch("/drivers/:driverId/verify", updateDriverVerification);

router.get("/overview", getAdminOverview);

router.get("/drivers/manage", getAllDrivers);

router.get("/users", getAllUsers);

router.get("/rides/manage", getAllRides);

router.get("/payments/manage", getAllPayments);
export default router;



