import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

import {
  getDriverProfile,
  updateDriverProfile,
  getDriverVehicle,
  createDriverVehicle,
  updateDriverVehicle,
  deleteDriverVehicle,
  updateDriverStatus,
  updateDriverLocation,
} from "../services/driverService.js";

export const getMe = asyncHandler(async (req, res) => {
  const driverProfile = await getDriverProfile(req.user._id);

  res.status(200).json({
    success: true,
    message: "Driver profile retrieved successfully",
    data: {
      driver: driverProfile,
    },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const driverProfile = await updateDriverProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Driver profile updated successfully",
    data: {
      driver: driverProfile,
    },
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { isOnline } = req.body;
  if (typeof isOnline !== "boolean") {
    throw new AppError("isOnline must be a boolean", 400);
  }

  const driverProfile = await updateDriverStatus(req.user._id, isOnline);

  res.status(200).json({
    success: true,
    message: isOnline ? "Driver is now online" : "Driver is now offline",
    data: {
      driver: driverProfile,
    },
  });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  const driverLocation = await updateDriverLocation(
    req.user._id,
    latitude,
    longitude,
  );

  res.status(200).json({
    success: true,
    message: "Driver location updated successfully",
    data: {
      location: driverLocation,
    },
  });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await getDriverVehicle(req.user._id);

  res.status(200).json({
    success: true,
    message: "Vehicle retrieved successfully",
    data: {
      vehicle,
    },
  });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await createDriverVehicle(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Vehicle created successfully",
    data: {
      vehicle,
    },
  });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await updateDriverVehicle(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Vehicle updated successfully",
    data: {
      vehicle,
    },
  });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await deleteDriverVehicle(req.user._id);

  res.status(200).json({
    success: true,
    message: "Vehicle deactivated successfully",
    data: {
      vehicle,
    },
  });
});
