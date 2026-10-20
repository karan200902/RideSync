import DriverLocation from "../models/DriverLocation.js";
import DriverProfile from "../models/DriverProfile.js";
import Vehicle from "../models/Vehicle.js";
import AppError from "../utils/AppError.js";

const DRIVER_SEARCH_RADIUS_KM = 5;
const MAX_LOCATION_AGE_MINUTES = 2;
const MAX_DRIVERS = 50;

export const findNearbyDrivers = async ({
  longitude,
  latitude,
  vehicleType,
  excludeDriverId = null,
}) => {
  if (typeof longitude !== "number" || typeof latitude !== "number") {
    throw new AppError("Valid latitude and longitude are required", 400);
  }

  if (!["bike", "auto", "car"].includes(vehicleType)) {
    throw new AppError("Invalid vehicle type", 400);
  }

  const maxLocationAge = new Date(
    Date.now() - MAX_LOCATION_AGE_MINUTES * 60 * 1000,
  );

  const nearbyLocations = await DriverLocation.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: DRIVER_SEARCH_RADIUS_KM * 1000,
      },
    },
    lastUpdatedAt: {
      $gte: maxLocationAge,
    },
  })
    .limit(MAX_DRIVERS)
    .lean();
  if (!nearbyLocations.length) {
    return [];
  }

  const driverIds = nearbyLocations.map((location) => location.driver);
  const vehicles = await Vehicle.find({
    driver: { $in: driverIds },
    vehicleType,
    isActive: true,
  }).lean();
  if (!vehicles.length) {
    return [];
  }
  const vehicleMap = new Map(
    vehicles.map((vehicle) => [vehicle.driver.toString(), vehicle]),
  );

  const driverQuery = {
    _id: { $in: driverIds },
    verificationStatus: "verified",
    isOnline: true,
  };
  if (excludeDriverId) {
    driverQuery._id.$nin = [excludeDriverId];
  }
  const drivers = await DriverProfile.find(driverQuery)
    .populate("user", "name phone")
    .lean();
  const driverMap = new Map(
    drivers.map((driver) => [driver._id.toString(), driver]),
  );
  return nearbyLocations
    .map((location) => {
      const driverId = location.driver.toString();

      const driver = driverMap.get(driverId);
      const vehicle = vehicleMap.get(driverId);

      if (!driver || !vehicle) {
        return null;
      }

      return {
        driver,
        vehicle,
        location: location.location,
        lastUpdatedAt: location.lastUpdatedAt,
      };
    })
    .filter(Boolean);
};
