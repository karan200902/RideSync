import mongoose from "mongoose";
import Ride from "../models/Ride.js";
import DriverProfile from "../models/DriverProfile.js";
import Vehicle from "../models/Vehicle.js";
import AppError from "../utils/AppError.js";
import { transitionRideState } from "./rideStateService.js";
import Payment from "../models/Payment.js";

export const acceptRide = async (rideId, driverUserId) => {
  const session = await mongoose.startSession();
  try {
    let assignedRide;
    await session.withTransaction(async () => {
      const driver = await DriverProfile.findOne({
        user: driverUserId,
      }).session(session);
      if (!driver) {
        throw new AppError("Driver profile not found", 404);
      }
      if (driver.verificationStatus !== "verified") {
        throw new AppError("Driver is not verified", 403);
      }
      if (!driver.isOnline) {
        throw new AppError("Driver is offline", 400);
      }
      if (driver.activeRide) {
        throw new AppError("Driver already has an active ride", 409);
      }
      const vehicle = await Vehicle.findOne({
        driver: driver._id,
        isActive: true,
      }).session(session);
      if (!vehicle) {
        throw new AppError("Driver does not have an active vehicle", 400);
      }
      assignedRide = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: "SEARCHING",
          driver: null,
          vehicleType: vehicle.vehicleType,
        },
        {
          $set: {
            driver: driver._id,
            status: "DRIVER_ASSIGNED",
            assignedAt: new Date(),
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        },
      );

      if (!assignedRide) {
        throw new AppError("Ride is no longer available", 409);
      }
      const updatedDriver = await DriverProfile.findOneAndUpdate(
        {
          _id: driver._id,
          activeRide: null,
          isOnline: true,
        },
        {
          $set: {
            activeRide: assignedRide._id,
          },
        },
        {
          new: true,
          session,
        },
      );
      if (!updatedDriver) {
        throw new AppError("Driver is no longer available", 409);
      }
    });
    return assignedRide;
  } finally {
    await session.endSession();
  }
};

export const startDriverArrival = async (rideId, driverUserId) => {
  const driver = await DriverProfile.findOne({
    user: driverUserId,
  });
  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }
  const ride = await Ride.findOne({
    _id: rideId,
    driver: driver._id,
  });
  if (!ride) {
    throw new AppError("Ride not found or not assigned to this driver", 404);
  }
  if (driver.activeRide?.toString() !== rideId) {
    throw new AppError("This ride is not the driver's active ride", 403);
  }
  const updatedRide = await transitionRideState(
    rideId,
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
  );
  return updatedRide;
};

export const markDriverArrived = async (rideId, driverUserId) => {
  const driver = await DriverProfile.findOne({
    user: driverUserId,
  });
  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }
  const ride = await Ride.findOne({
    _id: rideId,
    driver: driver._id,
  });
  if (!ride) {
    throw new AppError("Ride not found or not assigned to this driver", 404);
  }
  if (driver.activeRide?.toString() !== rideId) {
    throw new AppError("This ride is not the driver's active ride", 403);
  }
  const updatedRide = await transitionRideState(
    rideId,
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
  );
  return updatedRide;
};

export const startTrip = async (rideId, driverUserId) => {
  const driver = await DriverProfile.findOne({
    user: driverUserId,
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  const ride = await Ride.findOne({
    _id: rideId,
    driver: driver._id,
  });

  if (!ride) {
    throw new AppError("Ride not found or not assigned to this driver", 404);
  }

  if (driver.activeRide?.toString() !== rideId) {
    throw new AppError("This ride is not the driver's active ride", 403);
  }

  const updatedRide = await transitionRideState(
    rideId,
    "DRIVER_ARRIVED",
    "IN_PROGRESS",
  );

  return updatedRide;
};

export const completeTrip = async (rideId, driverUserId) => {
  const session = await mongoose.startSession();

  try {
    let updatedRide;

    await session.withTransaction(async () => {
      const driver = await DriverProfile.findOne({
        user: driverUserId,
      }).session(session);

      if (!driver) {
        throw new AppError("Driver profile not found", 404);
      }

      const ride = await Ride.findOne({
        _id: rideId,
        driver: driver._id,
        status: "IN_PROGRESS",
      }).session(session);

      if (!ride) {
        throw new AppError(
          "Ride not found, not assigned to this driver, or not in progress",
          404,
        );
      }

      if (driver.activeRide?.toString() !== rideId) {
        throw new AppError("This ride is not the driver's active ride", 403);
      }

      // Final fare must be calculated/validated by the server.
      const finalFare = ride.estimatedFare;

      // 1. IN_PROGRESS → COMPLETED
      updatedRide = await transitionRideState(
        rideId,
        "IN_PROGRESS",
        "COMPLETED",
        {
          finalFare,
        },
      );

      if (!updatedRide) {
        throw new AppError("Ride could not be completed", 409);
      }

      // 2. COMPLETED → PAYMENT_PENDING
      updatedRide = await transitionRideState(
        rideId,
        "COMPLETED",
        "PAYMENT_PENDING",
      );

      if (!updatedRide) {
        throw new AppError(
          "Ride completed but could not move to payment pending",
          409,
        );
      }

      // 3. Create payment for this ride
      const existingPayment = await Payment.findOne({
        ride: ride._id,
      }).session(session);

      if (!existingPayment) {
        console.log("Creating payment for ride:", ride._id.toString());

        const [createdPayment] = await Payment.create(
          [
            {
              ride: ride._id,
              passenger: ride.passenger,
              driver: driver._id,
              amount: finalFare,
              currency: "INR",
              status: "PENDING",
            },
          ],
          { session },
        );

        console.log("Payment created in transaction:", createdPayment._id.toString());
      } else {
        console.log(
          "Payment already exists:",
          existingPayment._id.toString(),
        );
      }
    });

    return updatedRide;
  } catch (error) {
    console.error("Complete trip transaction failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getActiveRide = async (driverUserId) => {
  const driver = await DriverProfile.findOne({
    user: driverUserId,
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  if (!driver.activeRide) {
    return null;
  }

  const ride = await Ride.findOne({
    _id: driver.activeRide,
    driver: driver._id,
  })
    .populate("passenger", "name phone")
    .populate("driver", "rating totalRides");

  if (!ride) {
    throw new AppError("Active ride not found", 404);
  }

  return ride;
};

export const getAvailableRides = async (driverUserId) => {
  const driver = await DriverProfile.findOne({
    user: driverUserId,
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  if (driver.verificationStatus !== "verified") {
    throw new AppError("Driver is not verified", 403);
  }

  if (!driver.isOnline) {
    return [];
  }

  if (driver.activeRide) {
    return [];
  }

  const vehicle = await Vehicle.findOne({
    driver: driver._id,
    isActive: true,
  });

  if (!vehicle) {
    return [];
  }

  const rides = await Ride.find({
    status: "SEARCHING",
    driver: null,
    vehicleType: vehicle.vehicleType,
  })
    .populate("passenger", "name phone")
    .sort({ createdAt: -1 })
    .limit(20);

  return rides;
};


export const getDriverRides = async (
  driverUserId,
  page = 1,
  limit = 10,
  status,
) => {
  const driver = await DriverProfile.findOne({
    user: driverUserId,
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  const allowedStatuses = [
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

  const filter = { driver: driver._id };

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid ride status filter", 400);
    }

    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [rides, total] = await Promise.all([
    Ride.find(filter)
      .populate("passenger", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Ride.countDocuments(filter),
  ]);

  return {
    rides,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};