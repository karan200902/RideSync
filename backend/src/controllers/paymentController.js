import Payment from "../models/Payment.js";
import {
  verifyRazorpayPayment,
  confirmRazorpayPayment,
} from "../services/paymentService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyRazorpayPaymentRequest = async (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
  const payment = await verifyRazorpayPayment(
    req.params.paymentId,
    req.user._id,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  );

  res.status(200).json({
    success: true,
    message: "Razorpay payment signature verified successfully",
    data: {
      paymentId: payment._id,
      status: payment.status,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
    },
  });
};

export const confirmRazorpayPaymentRequest = async (req, res) => {
  const payment = await confirmRazorpayPayment(
    req.params.paymentId,
    req.user._id,
  );

  res.status(200).json({
    success: true,
    message: "Payment confirmed successfully",
    data: {
      paymentId: payment._id,
      status: payment.status,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      paidAt: payment.paidAt,
    },
  });
};


export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    search = "",
    status = "all",
    method = "all",
    page = "1",
    limit = "10",
  } = req.query;

  const currentPage = Number(page);
  const pageSize = Number(limit);

  // Validate pagination
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new AppError(
      "Page must be positive and limit must be between 1 and 100",
      400
    );
  }

  // Validate status and payment method
  const validStatuses = [
    "PENDING",
    "PROCESSING",
    "SUCCESS",
    "FAILED",
    "REFUNDED",
  ];

  const validMethods = [
    "cash",
    "upi",
    "card",
    "netbanking",
    "wallet",
  ];

  if (status !== "all" && !validStatuses.includes(status)) {
    throw new AppError("Invalid payment status", 400);
  }

  if (method !== "all" && !validMethods.includes(method)) {
    throw new AppError("Invalid payment method", 400);
  }

  const searchText = String(search).trim();

  if (searchText.length > 100) {
    throw new AppError("Search cannot exceed 100 characters", 400);
  }

  const filter = {};

  if (status !== "all") {
    filter.status = status;
  }

  if (method !== "all") {
    filter.method = method;
  }

  if (searchText) {
    const escapedSearch = searchText.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const matchingUsers = await User.find({
      role: { $in: ["passenger", "driver"] },
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ],
    })
      .select("_id role")
      .lean();

    const passengerIds = matchingUsers
      .filter((user) => user.role === "passenger")
      .map((user) => user._id);

    const driverUserIds = matchingUsers
      .filter((user) => user.role === "driver")
      .map((user) => user._id);

    const matchingDrivers = await DriverProfile.find({
      user: { $in: driverUserIds },
    })
      .select("_id")
      .lean();

    filter.$or = [
      { transactionId: { $regex: escapedSearch, $options: "i" } },
      { razorpayOrderId: { $regex: escapedSearch, $options: "i" } },
      { razorpayPaymentId: { $regex: escapedSearch, $options: "i" } },
      { passenger: { $in: passengerIds } },
      { driver: { $in: matchingDrivers.map((driver) => driver._id) } },
    ];
  }

  const skip = (currentPage - 1) * pageSize;

  const [payments, totalPayments] = await Promise.all([
    Payment.find(filter)
      .populate("passenger", "name email phone")
      .populate({
        path: "driver",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .populate("ride", "status vehicleType pickup destination")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Payment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: {
      payments,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalPayments / pageSize),
        totalPayments,
        limit: pageSize,
        hasNextPage: skip + payments.length < totalPayments,
        hasPreviousPage: currentPage > 1,
      },
    },
  });
});