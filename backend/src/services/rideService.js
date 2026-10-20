import Ride from "../models/Ride.js";
import AppError from "../utils/AppError.js";

import { calculateDistance, calculateEstimatedDuration } from "../utils/geo.js";
import { calculateFare } from "./fareService.js";
import Payment from "../models/Payment.js";

export const createRide = async (userId, rideData) => {
  const activeRide = await Ride.findOne({
    passenger: userId,
    status: {
      $in: [
        "REQUESTED",
        "SEARCHING",
        "DRIVER_ASSIGNED",
        "DRIVER_ARRIVING",
        "DRIVER_ARRIVED",
        "IN_PROGRESS",
        "PAYMENT_PENDING",
      ],
    },
  });

  if (activeRide) {
    throw new AppError("You already have an active ride", 409);
  }

  const { pickup, destination, vehicleType } = rideData;

  const distance = calculateDistance(
    pickup.latitude,
    pickup.longitude,
    destination.latitude,
    destination.longitude,
  );

  if (distance <= 0) {
    throw new AppError("Ride distance must be greater than zero", 400);
  }

  const duration = calculateEstimatedDuration(distance, vehicleType);

  const fare = calculateFare({ distance, duration, vehicleType });

  const ride = await Ride.create({
    passenger: userId,
    vehicleType,
    pickup: {
      address: pickup.address.trim(),
      location: {
        type: "Point",
        coordinates: [pickup.longitude, pickup.latitude],
      },
    },
    destination: {
      address: destination.address.trim(),
      location: {
        type: "Point",
        coordinates: [destination.longitude, destination.latitude],
      },
    },
    distance: fare.distance,
    estimatedDuration: fare.duration,
    estimatedFare: fare.estimatedFare,
    status: "SEARCHING",
    requestedAt: new Date(),
  });
  return ride;
};

export const getRideById = async (userId, rideId) => {
  const ride = await Ride.findOne({
    _id: rideId,
    passenger: userId,
  })
    .populate({
      path: "passenger",
      select: "name email phone",
    })
    .populate({
      path: "driver",
      populate: {
        path: "user",
        select: "name phone",
      },
    });

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  const payment = await Payment.findOne({
    ride: ride._id,
  });

  return {
    ride,
    payment,
  };
};

export const getPassengerRides = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [rides, total] = await Promise.all([
    Ride.find({
      passenger: userId,
    })
      .populate({
        path: "driver",
        populate: {
          path: "user",
          select: "name phone",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Ride.countDocuments({
      passenger: userId,
    }),
  ]);
  return {
    rides,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const cancelRide = async (userId, rideId, cancellationReason) => {
  const ride = await Ride.findOne({
    _id: rideId,
    passenger: userId,
  });
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  const cancellableStatuses = [
    "REQUESTED",
    "SEARCHING",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
  ];

  if (!cancellableStatuses.includes(ride.status)) {
    throw new AppError(
      `Ride cannot be cancelled when status is ${ride.status}`,
      400,
    );
  }
  if (cancellationReason && cancellationReason.trim().length > 200) {
    throw new AppError("Cancellation reason cannot exceed 200 characters", 400);
  }

  ride.status = "CANCELLED";
  ride.cancelledBy = "passenger";
  ride.cancellationReason = cancellationReason?.trim() || null;
  ride.cancelledAt = new Date();
  await ride.save();
  return ride;
};
