import AppError from "../utils/AppError.js";

const FARE_CONFIG = {
  bike: {
    baseFare: 30,
    perKm: 8,
    perMinute: 1,
    minimumFare: 50,
  },
  auto: {
    baseFare: 40,
    perKm: 11,
    perMinute: 1.5,
    minimumFare: 70,
  },
  car: {
    baseFare: 60,
    perKm: 14,
    perMinute: 2,
    minimumFare: 100,
  },
};

export const calculateFare = ({ distance, duration, vehicleType }) => {
  if (typeof distance !== "number" || typeof duration !== "number") {
    throw new AppError("Distance and duration must be numbers", 400);
  }

  if (distance < 0 || duration < 0) {
    throw new AppError("Distance and duration cannot be negative", 400);
  }

  const config = FARE_CONFIG[vehicleType];
  if (!config) {
    throw new AppError("Invalid vehicle type", 400);
  }

  const distanceFare = distance * config.perKm;
  const timeFare = duration * config.perMinute;
  const calculatedFare = config.baseFare + distanceFare + timeFare;

  const finalFare = Math.max(calculatedFare, config.minimumFare);

  return {
    vehicleType,
    distance: Number(distance.toFixed(2)),
    duration: Number(duration.toFixed(2)),
    baseFare: config.baseFare,
    distanceFare: Number(distanceFare.toFixed(2)),
    timeFare: Number(timeFare.toFixed(2)),
    minimumFare: config.minimumFare,
    estimatedFare: Number(finalFare.toFixed(2)),
  };
};
