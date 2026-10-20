import mongoose from "mongoose";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import Ride from "../models/Ride.js";
import AppError from "../utils/AppError.js";
import DriverProfile from "../models/DriverProfile.js";
import { transitionRideState } from "./rideStateService.js";

export const markPaymentPending = async (rideId) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (ride.status !== "COMPLETED") {
    throw new AppError("Only completed rides can move to payment pending", 400);
  }

  const updatedRide = await transitionRideState(
    rideId,
    "COMPLETED",
    "PAYMENT_PENDING",
  );

  return updatedRide;
};

export const createPaymentForRide = async (rideId, passengerUserId) => {
  const ride = await Ride.findOne({
    _id: rideId,
    passenger: passengerUserId,
  }).populate("driver");

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (ride.status !== "PAYMENT_PENDING") {
    throw new AppError(
      "Payment can only be created for rides awaiting payment",
      400,
    );
  }

  if (!ride.driver) {
    throw new AppError("Ride does not have an assigned driver", 400);
  }

  const existingPayment = await Payment.findOne({
    ride: ride._id,
  });

  if (existingPayment) {
    return existingPayment;
  }

  // Final fare must come from the server.
  // For now, if finalFare has not been calculated separately,
  // use the server-generated estimatedFare.
  const amount = ride.finalFare ?? ride.estimatedFare;

  if (typeof amount !== "number" || amount < 0) {
    throw new AppError("Invalid ride fare", 400);
  }

  try {
    const payment = await Payment.create({
      ride: ride._id,
      passenger: ride.passenger,
      driver: ride.driver._id,
      amount,
      currency: "INR",
      status: "PENDING",
    });
    console.log("Payment enters");
    
    return payment;
  } catch (error) {
    if (error.code === 11000) {
      const payment = await Payment.findOne({
        ride: ride._id,
      });

      if (payment) {
        return payment;
      }
    }
    throw error;
  }
};

export const updatePaymentStatus = async ({
  paymentId,
  status,
  transactionId = null,
  method = null,
  failureReason = null,
}) => {
  const session = await mongoose.startSession();

  try {
    let updatedPayment;

    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      const allowedTransitions = {
        PENDING: ["PROCESSING", "SUCCESS", "FAILED"],
        PROCESSING: ["SUCCESS", "FAILED"],
        SUCCESS: [],
        FAILED: [],
        REFUNDED: [],
      };

      if (!allowedTransitions[payment.status].includes(status)) {
        throw new AppError(
          `Invalid payment transition: ${payment.status} → ${status}`,
          400,
        );
      }

      const updates = {
        status,
      };

      if (transactionId) {
        updates.transactionId = transactionId;
      }

      if (method) {
        updates.method = method;
      }

      if (status === "SUCCESS") {
        updates.paidAt = new Date();
        updates.failureReason = null;
      }

      if (status === "FAILED") {
        updates.failureReason = failureReason?.trim() || "Payment failed";
      }

      updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!updatedPayment) {
        throw new AppError("Payment could not be updated", 409);
      }

      // Only successful payment moves the ride to PAID.
      if (status === "SUCCESS") {
        const updatedRide = await Ride.findOneAndUpdate(
          {
            _id: payment.ride,
            status: "PAYMENT_PENDING",
          },
          {
            $set: {
              status: "PAID",
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          },
        );

        if (!updatedRide) {
          throw new AppError("Ride could not be marked as paid", 409);
        }
        const updatedDriver = await DriverProfile.findOneAndUpdate(
          {
            _id: payment.driver,
          },
          {
            $inc: {
              totalRides: 1,
              totalEarnings: payment.amount,
            },
          },
          {
            new: true,
            session,
          },
        );
        if (!updatedDriver) {
          throw new AppError("Driver earnings could not be updated", 409);
        }
      }
    });

    return updatedPayment;
  } finally {
    await session.endSession();
  }
};

export const getPaymentById = async (paymentId, passengerUserId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    passenger: passengerUserId,
  })
    .populate("ride")
    .populate("driver");
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }
  return payment;
};

export const createRazorpayOrder = async (paymentId, passengerUserId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    passenger: passengerUserId,
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "PENDING") {
    throw new AppError(
      "Only pending payments can create a Razorpay order",
      400,
    );
  }

  if (payment.razorpayOrderId) {
    return payment;
  }

  const options = {
    amount: Math.round(payment.amount * 100),
    currency: payment.currency,
    receipt: `ridesync_${payment._id}`,
  };

  const order = await razorpay.orders.create(options);

  payment.razorpayOrderId = order.id;

  await payment.save();

  return payment;
};

export const verifyRazorpayPayment = async (
  paymentId,
  passengerUserId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    passenger: passengerUserId,
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status === "SUCCESS") {
    return payment;
  }

  if (payment.status !== "PENDING") {
    throw new AppError("Only pending payments can be verified", 400);
  }

  if (!payment.razorpayOrderId) {
    throw new AppError("Razorpay order has not been created", 400);
  }

  if (payment.razorpayOrderId !== razorpayOrderId) {
    throw new AppError("Razorpay order ID does not match", 400);
  }

  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    throw new AppError(
      "Razorpay payment verification details are required",
      400,
    );
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");
  const receivedSignatureBuffer = Buffer.from(razorpaySignature, "hex");
  const isSignatureValid =
    expectedSignatureBuffer.length === receivedSignatureBuffer.length &&
    crypto.timingSafeEqual(expectedSignatureBuffer, receivedSignatureBuffer);

  if (!isSignatureValid) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  // Payment is verified by Razorpay signature.
  // The actual SUCCESS transition will be handled
  // transaction-safely in the next step.

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpayOrderId = razorpayOrderId;
  payment.status = "PROCESSING";

  await payment.save();

  return payment;
};

export const confirmRazorpayPayment = async (paymentId, passengerUserId) => {
  const session = await mongoose.startSession();

  try {
    let updatedPayment;

    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        _id: paymentId,
        passenger: passengerUserId,
      }).session(session);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // Idempotency:
      // If payment is already successful, don't process again.
      if (payment.status === "SUCCESS") {
        updatedPayment = payment;
        return;
      }

      if (payment.status !== "PROCESSING") {
        throw new AppError("Payment must be in PROCESSING state", 400);
      }

      if (!payment.razorpayPaymentId) {
        throw new AppError("Razorpay payment ID is missing", 400);
      }

      payment.status = "SUCCESS";
      payment.paidAt = new Date();

      updatedPayment = await payment.save({
        session,
      });

      // Move ride from PAYMENT_PENDING → PAID
      const ride = await Ride.findOneAndUpdate(
        {
          _id: payment.ride,
          status: "PAYMENT_PENDING",
        },
        {
          $set: {
            status: "PAID",
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!ride) {
        throw new AppError("Ride could not be marked as PAID", 409);
      }

      // Update driver earnings and clear active ride
      const driver = await DriverProfile.findByIdAndUpdate(
        payment.driver,
        {
          $inc: {
            totalRides: 1,
            totalEarnings: payment.amount,
          },
          $set: {
            activeRide: null,
          },
        },
        {
          session,
          runValidators: true,
          new: true,
        },
      );

      if (!driver) {
        throw new AppError("Driver profile could not be updated", 409);
      }
    });

    return updatedPayment;
  } finally {
    await session.endSession();
  }
};
