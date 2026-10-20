import DriverProfile from "../models/DriverProfile.js";
import DriverLocation from "../models/DriverLocation.js";
import Vehicle from "../models/Vehicle.js";
import AppError from "../utils/AppError.js";

export const getDriverProfile = async (userId) => {
  const driverProfile = await DriverProfile.findOne({
    user: userId,
  }).populate("user", "name email phone role");

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  return driverProfile;
};

export const updateDriverProfile = async (userId, updateData) => {
  const allowedFields = ["licenseNumber"];

  const updates = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  }

  if (updates.licenseNumber) {
    updates.licenseNumber = updates.licenseNumber.toUpperCase();

    const existingDriver = await DriverProfile.findOne({
      licenseNumber: updates.licenseNumber,
      user: { $ne: userId },
    });

    if (existingDriver) {
      throw new AppError("License number is already registered", 409);
    }
  }

  const driverProfile = await DriverProfile.findOneAndUpdate(
    { user: userId },
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "name email phone role");

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  return driverProfile;
};

export const updateDriverStatus = async (userId, isOnline) => {
  const driverProfile = await DriverProfile.findOne({ user: userId });
  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }
  if (isOnline === true) {
    if (driverProfile.verificationStatus !== "verified") {
      throw new AppError("Driver must be verified before going online", 403);
    }
  }

  const vehicle = await Vehicle.findOne({
    driver: driverProfile._id,
    isActive: true,
  });
  if (!vehicle) {
    throw new AppError("An active vehicle is required to go online", 400);
  }
  driverProfile.isOnline = isOnline;
  await driverProfile.save();
  return driverProfile;
};

export const updateDriverLocation = async (userId, latitude, longitude) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new AppError("Latitude and longitude must be numbers", 400);
  }

  if (latitude < -90 || latitude > 90) {
    throw new AppError("Latitude must be between -90 and 90", 400);
  }

  if (longitude < -180 || longitude > 180) {
    throw new AppError("Longitude must be between -180 and 180", 400);
  }
  const driverProfile = await DriverProfile.findOne({
    user: userId,
  });
  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  if (driverProfile.verificationStatus !== "verified") {
    throw new AppError("Driver must be verified to update location", 403);
  }

  if (!driverProfile.isOnline) {
    throw new AppError("Driver must be online to update location", 400);
  }

  const driverLocation = await DriverLocation.findOneAndUpdate(
    {
      driver: driverProfile._id,
    },
    {
      $set: {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        lastUpdatedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );
  return driverLocation;
};

export const getDriverVehicle = async (userId) => {
  const driverProfile = await DriverProfile.findOne({
    user: userId,
  });

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  const vehicle = await Vehicle.findOne({
    driver: driverProfile._id,
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  return vehicle;
};

export const createDriverVehicle = async (userId, vehicleData) => {
  const driverProfile = await DriverProfile.findOne({
    user: userId,
  });

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  const existingVehicle = await Vehicle.findOne({
    driver: driverProfile._id,
  });

  if (existingVehicle) {
    throw new AppError("Driver already has a vehicle", 409);
  }

  const existingRegistration = await Vehicle.findOne({
    registrationNumber: vehicleData.registrationNumber.toUpperCase(),
  });

  if (existingRegistration) {
    throw new AppError(
      "Vehicle registration number is already registered",
      409,
    );
  }

  const vehicle = await Vehicle.create({
    driver: driverProfile._id,
    registrationNumber: vehicleData.registrationNumber.toUpperCase(),
    vehicleType: vehicleData.vehicleType,
    make: vehicleData.make,
    model: vehicleData.model,
    color: vehicleData.color,
    year: vehicleData.year,
  });

  return vehicle;
};

export const updateDriverVehicle = async (userId, vehicleData) => {
  const driverProfile = await DriverProfile.findOne({
    user: userId,
  });

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  const vehicle = await Vehicle.findOne({
    driver: driverProfile._id,
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  const allowedFields = [
    "registrationNumber",
    "vehicleType",
    "make",
    "model",
    "color",
    "year",
  ];

  for (const field of allowedFields) {
    if (vehicleData[field] !== undefined) {
      vehicle[field] =
        field === "registrationNumber"
          ? vehicleData[field].toUpperCase()
          : vehicleData[field];
    }
  }

  if (vehicle.isModified("registrationNumber")) {
    const existingVehicle = await Vehicle.findOne({
      registrationNumber: vehicle.registrationNumber,
      _id: { $ne: vehicle._id },
    });

    if (existingVehicle) {
      throw new AppError(
        "Vehicle registration number is already registered",
        409,
      );
    }
  }

  await vehicle.save();

  return vehicle;
};

export const deleteDriverVehicle = async (userId) => {
  const driverProfile = await DriverProfile.findOne({
    user: userId,
  });

  if (!driverProfile) {
    throw new AppError("Driver profile not found", 404);
  }

  const vehicle = await Vehicle.findOne({
    driver: driverProfile._id,
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  vehicle.isActive = false;

  await vehicle.save();

  return vehicle;
};
