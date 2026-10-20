import express from "express";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import {
  getMe,
  updateMe,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateStatus,
  updateLocation
} from "../controllers/driverController.js";

const router = express.Router();

router.use(authenticate, authorize("driver"));

router.get("/me", getMe);
router.patch("/me", updateMe);
router.patch("/status", updateStatus);

router.get("/vehicle", getVehicle);
router.post("/vehicle", createVehicle);
router.patch("/vehicle", updateVehicle);
router.delete("/vehicle", deleteVehicle);
router.patch("/location", updateLocation);

export default router;
