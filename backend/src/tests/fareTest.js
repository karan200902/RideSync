import { calculateDistance, calculateEstimatedDuration } from "../utils/geo.js";

import { calculateFare } from "../services/fareService.js";

const pickup = {
  latitude: 29.9457,
  longitude: 78.1642,
};

const destination = {
  latitude: 29.956,
  longitude: 78.17,
};

const vehicleType = "car";

const distance = calculateDistance(
  pickup.latitude,
  pickup.longitude,
  destination.latitude,
  destination.longitude,
);

const duration = calculateEstimatedDuration(distance, vehicleType);

const fare = calculateFare({
  distance,
  duration,
  vehicleType,
});

console.log({
  distance,
  duration,
  fare,
});
