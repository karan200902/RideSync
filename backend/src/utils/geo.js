export const calculateDistance = (
  latitude1,
  longitude1,
  latitude2,
  longitude2,
) => {
  const EARTH_RADIUS_KM = 6371;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);
  const deltaLat = toRadians(latitude2 - latitude1);
  const deltaLng = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

export const calculateEstimatedDuration = (distance, vehicleType) => {
  const averageSpeed = {
    bike: 30,
    auto: 25,
    car: 30,
  };
  const speed = averageSpeed[vehicleType];

  if (!speed) {
    throw new Error("Invalid vehicle type");
  }

  const durationHours = distance / speed;

  return durationHours * 60;
};
