import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

import {
  validateCreateRide,
  validateCancellation,
} from "../validators/rideValidators.js";
import {
  createRide,
  getRideById,
  getPassengerRides,
  cancelRide,
} from "../services/rideService.js";
import {
  acceptRide,
  startDriverArrival,
  markDriverArrived,
  startTrip,
  completeTrip,
  getActiveRide,
  getAvailableRides,
  getDriverRides
} from "../services/driverRideService.js";
import {
  markPaymentPending,
  createPaymentForRide,
  updatePaymentStatus,
  getPaymentById,
  createRazorpayOrder,
} from "../services/paymentService.js";

import {
  getDriverEarnings,
} from "../services/driverEarningsService.js";

export const createRideRequest = asyncHandler(async (req, res) => {
  validateCreateRide(req.body);
  const { pickup, destination, vehicleType } = req.body;
  const ride = await createRide(req.user._id, {
    pickup,
    destination,
    vehicleType,
  });

  res.status(201).json({
    success: true,
    message: "Ride created successfully",
    data: {
      ride,
    },
  });
});

export const getRide = asyncHandler(async (req, res) => {
  const result = await getRideById(req.user._id, req.params.rideId);

  res.status(200).json({
    success: true,
    message: "Ride fetched successfully",
    data: {
      ride: result.ride,
      payment: result.payment,
    },
  });
});
export const getMyRides = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  const result = await getPassengerRides(req.user._id, page, limit);
  res.status(200).json({
    success: true,
    message: "Ride history fetched successfully",
    data: result,
  });
});

export const cancelRideRequest = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  validateCancellation(cancellationReason);
  const ride = await cancelRide(
    req.user._id,
    req.params.rideId,
    cancellationReason,
  );

  res.status(200).json({
    success: true,
    message: "Ride cancelled successfully",
    data: {
      ride,
    },
  });
});

export const acceptRideRequest = asyncHandler(async (req, res) => {
  const ride = await acceptRide(req.params.rideId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Ride accepted successfully",
    data: {
      ride,
    },
  });
});

export const startDriverArrivalRequest = asyncHandler(async (req, res) => {
  const ride = await startDriverArrival(req.params.rideId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Driver is now arriving",
    data: {
      ride,
    },
  });
});

export const markDriverArrivedRequest = asyncHandler(async (req, res) => {
  const ride = await markDriverArrived(req.params.rideId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Driver has arrived",
    data: {
      ride,
    },
  });
});

export const startTripRequest = asyncHandler(async (req, res) => {
  const ride = await startTrip(req.params.rideId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Trip started successfully",
    data: {
      ride,
    },
  });
});

export const completeTripRequest = asyncHandler(async (req, res) => {
  const ride = await completeTrip(req.params.rideId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Trip completed successfully",
    data: {
      ride,
    },
  });
});

export const markPaymentPendingRequest = asyncHandler(async (req, res) => {
  const ride = await markPaymentPending(req.params.rideId);

  res.status(200).json({
    success: true,
    message: "Ride is now awaiting payment",
    data: {
      ride,
    },
  });
});

export const createPaymentRequest = asyncHandler(async (req, res) => {
  const payment = await createPaymentForRide(req.params.rideId, req.user._id);

  res.status(201).json({
    success: true,
    message: "Payment record created successfully",
    data: {
      payment,
    },
  });
});

export const updatePaymentStatusRequest = asyncHandler(async (req, res) => {
  const { status, transactionId, method, failureReason } = req.body;
  const payment = await updatePaymentStatus({
    paymentId: req.params.paymentId,
    status,
    transactionId,
    method,
    failureReason,
  });
  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    data: {
      payment,
    },
  });
});

export const getPaymentRequest = asyncHandler(async (req, res) => {
  const payment = await getPaymentById(req.params.paymentId, req.user._id);

  res.status(200).json({
    success: true,
    data: {
      payment,
    },
  });
});

export const createRazorpayOrderRequest = asyncHandler(async (req, res) => {
  const payment = await createRazorpayOrder(req.params.paymentId, req.user._id);

  const order = {
    id: payment.razorpayOrderId,
    amount: Math.round(payment.amount * 100),
    currency: payment.currency,
    receipt: `ridesync_${payment._id}`,
  };

  res.status(200).json({
    success: true,
    message: "Razorpay order created successfully",
    data: {
      order,
      payment: {
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        razorpayOrderId: payment.razorpayOrderId,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

export const getActiveRideRequest = asyncHandler(async (req, res) => {
  const ride = await getActiveRide(req.user._id);

  res.status(200).json({
    success: true,
    message: ride
      ? "Active ride retrieved successfully"
      : "Driver has no active ride",
    data: {
      ride,
    },
  });
});

export const getAvailableRidesRequest = asyncHandler(
  async (req, res) => {
    const rides = await getAvailableRides(req.user._id);

    res.status(200).json({
      success: true,
      message: "Available rides fetched successfully",
      data: {
        rides,
      },
    });
  },
);



export const getDriverRidesRequest = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    50,
  );

  const status = req.query.status
    ? String(req.query.status).toUpperCase()
    : undefined;

  const result = await getDriverRides(
    req.user._id,
    page,
    limit,
    status,
  );

  res.status(200).json({
    success: true,
    message: "Driver ride history fetched successfully",
    data: result,
  });
});


export const getDriverEarningsRequest = asyncHandler(
  async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50,
    );

    const status = req.query.status
      ? String(req.query.status).toUpperCase()
      : undefined;

    const result = await getDriverEarnings(
      req.user._id,
      page,
      limit,
      status,
    );

    res.status(200).json({
      success: true,
      message: "Driver earnings fetched successfully",
      data: result,
    });
  },
);