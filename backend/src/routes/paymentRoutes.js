import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";
import {
  getPaymentRequest,
  updatePaymentStatusRequest,
  createRazorpayOrderRequest,
} from "../controllers/rideController.js";
import { confirmRazorpayPaymentRequest, verifyRazorpayPaymentRequest } from "../controllers/paymentController.js";

const router = express.Router();
router.use(authenticate, authorize("passenger"));
router.get("/:paymentId", getPaymentRequest);
router.post("/:paymentId/razorpay/order", createRazorpayOrderRequest);
// Temporary testing route.
// This will be removed before Razorpay integration.
router.patch("/:paymentId/status", updatePaymentStatusRequest);
router.post("/:paymentId/razorpay/verify", verifyRazorpayPaymentRequest);
router.post("/:paymentId/razorpay/confirm", confirmRazorpayPaymentRequest);

export default router;
