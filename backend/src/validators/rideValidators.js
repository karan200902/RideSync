import AppError from "../utils/AppError.js";

const validateCoordinates = (latitude, longitude, fieldName) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new AppError(
      `${fieldName} latitude and longitude must be numbers`,
      400,
    );
  }
  if (latitude < -90 || latitude > 90) {
    throw new AppError(`${fieldName} latitude must be between -90 and 90`, 400);
  }
  if (longitude < -180 || longitude > 180) {
    throw new AppError(
      `${fieldName} longitude must be between -180 and 180`,
      400,
    );
  }
};

export const validateCreateRide = (data) => {
  const { pickup, destination, vehicleType } = data;
  if (!pickup || typeof pickup !== "object") {
    throw new AppError("Pickup location is required", 400);
  }
  if (!destination || typeof destination !== "object") {
    throw new AppError("Destination location is required", 400);
  }

  if (!pickup.address?.trim()) {
    throw new AppError("Pickup address is required", 400);
  }
  if (!destination.address?.trim()) {
    throw new AppError("Destination address is required", 400);
  }

  validateCoordinates(pickup.latitude, pickup.longitude, "Pickup");
  validateCoordinates(
    destination.latitude,
    destination.longitude,
    "Destination",
  );

  if (!["bike", "auto", "car"].includes(vehicleType)) {
    throw new AppError("Vehicle type must be bike, auto, or car", 400);
  }

  if (
    pickup.latitude === destination.latitude &&
    pickup.longitude === destination.longitude
  ) {
    throw new AppError("Pickup and destination cannot be the same", 400);
  }
  return true;
};

export const validateCancellation = (cancellationReason) => {
  if (
    cancellationReason !== undefined &&
    typeof cancellationReason !== "string"
  ) {
    throw new AppError("Cancellation reason must be a string", 400);
  }

  if (cancellationReason && cancellationReason.trim().length > 200) {
    throw new AppError("Cancellation reason cannot exceed 200 characters", 400);
  }

  return true;
};
