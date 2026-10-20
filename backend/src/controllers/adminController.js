
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import DriverProfile from "../models/DriverProfile.js";
import Ride from "../models/Ride.js";
import Payment from "../models/Payment.js";

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDrivers,
    pendingDrivers,
    onlineDrivers,
    totalRides,
    activeRides,
    completedRides,
    cancelledRides,
    revenueResult,
    recentRides,
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ["passenger", "driver"] } }),
    DriverProfile.countDocuments(),
    DriverProfile.countDocuments({ verificationStatus: "pending" }),
    DriverProfile.countDocuments({ isOnline: true }),
    Ride.countDocuments(),
    Ride.countDocuments({
      status: {
        $in: [
          "DRIVER_ASSIGNED",
          "DRIVER_ARRIVING",
          "DRIVER_ARRIVED",
          "IN_PROGRESS",
          "PAYMENT_PENDING",
        ],
      },
    }),
    Ride.countDocuments({ status: "PAID" }),
    Ride.countDocuments({ status: "CANCELLED" }),
    Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Ride.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("status vehicleType estimatedFare finalFare createdAt")
      .populate("passenger", "name")
      .populate("driver", "user")
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    message: "Admin overview retrieved successfully",
    data: {
      overview: {
        totalUsers,
        totalDrivers,
        pendingDrivers,
        onlineDrivers,
        totalRides,
        activeRides,
        completedRides,
        cancelledRides,
        totalRevenue: revenueResult[0]?.total ?? 0,
      },
      recentRides,
    },
  });
});

export const getPendingDrivers = asyncHandler(async (req, res) => {
  const drivers = await DriverProfile.find({
    verificationStatus: "pending",
  })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Pending drivers retrieved successfully",
    data: { drivers },
  });
});

export const updateDriverVerification = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { status } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    throw new AppError(
      "Status must be either verified or rejected",
      400,
    );
  }

  const driverProfile = await DriverProfile.findById(driverId);

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  if (driverProfile.verificationStatus !== "pending") {
    throw new AppError("Driver has already been reviewed", 400);
  }

  driverProfile.verificationStatus = status;
  await driverProfile.save();

  res.status(200).json({
    success: true,
    message: `Driver ${status} successfully`,
    data: { driver: driverProfile },
  });
});

export const getAllDrivers = asyncHandler(async (req, res) => {
  const {
    search = "",
    status = "all",
    availability = "all",
    page = "1",
    limit = "10",
  } = req.query;

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    throw new AppError(
      "Page must be positive and limit must be between 1 and 100",
      400
    );
  }

  const filter = {};

  if (status !== "all") {
    if (!["pending", "verified", "rejected"].includes(status)) {
      throw new AppError("Invalid verification status", 400);
    }

    filter.verificationStatus = status;
  }

  if (availability !== "all") {
    if (!["online", "offline"].includes(availability)) {
      throw new AppError("Invalid availability filter", 400);
    }

    filter.isOnline = availability === "online";
  }

  const normalizedSearch = String(search).trim();

  if (normalizedSearch) {
    if (normalizedSearch.length > 100) {
      throw new AppError("Search cannot exceed 100 characters", 400);
    }

    const escapedSearch = normalizedSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const matchingUsers = await User.find({
      role: "driver",
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ],
    })
      .select("_id role")
      .lean();

    filter.$or = [
      { licenseNumber: { $regex: escapedSearch, $options: "i" } },
      { user: { $in: matchingUsers.map((user) => user._id) } },
    ];
  }

  const skip = (parsedPage - 1) * parsedLimit;

  const [drivers, totalDrivers] = await Promise.all([
    DriverProfile.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),

    DriverProfile.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Drivers retrieved successfully",
    data: {
      drivers,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalDrivers / parsedLimit),
        totalDrivers,
        limit: parsedLimit,
        hasNextPage: skip + drivers.length < totalDrivers,
        hasPreviousPage: parsedPage > 1,
      },
    },
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    search = "",
    role = "all",
    status = "all",
    page = "1",
    limit = "10",
  } = req.query;

  const currentPage = Number(page);
  const pageSize = Number(limit);

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

  if (!["all", "passenger", "driver", "admin"].includes(role)) {
    throw new AppError("Invalid role filter", 400);
  }

  if (!["all", "active", "inactive"].includes(status)) {
    throw new AppError("Invalid account status filter", 400);
  }

  const searchText = String(search).trim();

  if (searchText.length > 100) {
    throw new AppError("Search cannot exceed 100 characters", 400);
  }

  const filter = {};

  // Exclude administrator accounts from the default user directory.
  // Admin accounts can be included explicitly with ?role=admin.
  if (role === "all") {
    filter.role = { $in: ["passenger", "driver"] };
  } else {
    filter.role = role;
  }

  if (status !== "all") {
    filter.isActive = status === "active";
  }

  if (searchText) {
    const escapedSearch = searchText.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { phone: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const skip = (currentPage - 1) * pageSize;

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("name email phone role isActive createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: {
      users,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalUsers / pageSize),
        totalUsers,
        limit: pageSize,
        hasNextPage: skip + users.length < totalUsers,
        hasPreviousPage: currentPage > 1,
      },
    },
  });
});


export const getAllRides = asyncHandler(async (req, res) => {
  const {
    search = "",
    status = "all",
    vehicleType = "all",
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

  // Validate filters
  const validStatuses = [
    "REQUESTED",
    "SEARCHING",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "PAYMENT_PENDING",
    "PAID",
    "CANCELLED",
  ];

  if (status !== "all" && !validStatuses.includes(status)) {
    throw new AppError("Invalid ride status", 400);
  }

  if (
    vehicleType !== "all" &&
    !["bike", "auto", "car"].includes(vehicleType)
  ) {
    throw new AppError("Invalid vehicle type", 400);
  }

  const searchText = String(search).trim();

  if (searchText.length > 100) {
    throw new AppError("Search cannot exceed 100 characters", 400);
  }

  const filter = {};

  if (status !== "all") {
    filter.status = status;
  }

  if (vehicleType !== "all") {
    filter.vehicleType = vehicleType;
  }

  // Search by pickup or destination address.
  // Passenger and driver names/emails are handled below.
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

    const matchingDrivers = await DriverProfile.find({
      user: { $in: matchingUsers.map((user) => user._id) },
    })
      .select("_id")
      .lean();

    filter.$or = [
      { "pickup.address": { $regex: escapedSearch, $options: "i" } },
      { "destination.address": { $regex: escapedSearch, $options: "i" } },
      {
        passenger: {
          $in: matchingUsers
            .filter((user) => user.role === "passenger")
            .map((user) => user._id),
        },
      },
      { driver: { $in: matchingDrivers.map((driver) => driver._id) } },
    ];
  }

  const skip = (currentPage - 1) * pageSize;

  const [rides, totalRides] = await Promise.all([
    Ride.find(filter)
      .populate("passenger", "name email phone")
      .populate({
        path: "driver",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Ride.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Rides retrieved successfully",
    data: {
      rides,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalRides / pageSize),
        totalRides,
        limit: pageSize,
        hasNextPage: skip + rides.length < totalRides,
        hasPreviousPage: currentPage > 1,
      },
    },
  });
});