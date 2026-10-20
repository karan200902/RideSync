import { validateCreateRide } from "../validators/rideValidators.js";

const validRide = {
  pickup: {
    address: "Haridwar Railway Station",
    latitude: 209.9457,
    longitude: 78.1642,
  },

  destination: {
    address: "Har Ki Pauri",
    latitude: 29.956,
    longitude: 78.17,
  },

  vehicleType: "car",
};

try {
  validateCreateRide(validRide);

  console.log("Ride validation passed");
} catch (error) {
  console.error(error.message);
}

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
