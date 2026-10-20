import express from "express";
import { testNearbyDrivers } from "../controllers/matchingController.js";

const router = express.Router();

router.get("/nearby", testNearbyDrivers);

export default router;
