import { calculateDistance } from "../utils/geo.js";

const distance = calculateDistance(
  29.9457,
  78.1642,
  29.956,
  78.170
);

console.log(
  `Distance: ${distance.toFixed(2)} km`
);