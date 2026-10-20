import asyncHandler from "../utils/asyncHandler.js";
import { findNearbyDrivers } from "../services/matchingService.js";

export const testNearbyDrivers = asyncHandler(async (req, res) => {
  const { latitude, longitude, vehicleType } = req.query;

  const drivers = await findNearbyDrivers({
    latitude: Number(latitude),
    longitude: Number(longitude),
    vehicleType,
  });

  res.status(200).json({
    success: true,
    count: drivers.length,
    data: drivers,
  });
});
