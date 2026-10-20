import API from "./axios.js";

// Create a new ride
export const createRide = async (rideData) => {
  const response = await API.post("/rides", rideData);

  return response.data;
};

// Get a single ride
export const getRideById = async (rideId) => {
  const response = await API.get(`/rides/${rideId}`);

  return response.data;
};

// Cancel a ride
export const cancelRide = async (rideId, reason) => {
  const response = await API.patch(`/rides/${rideId}/cancel`, {
    reason,
  });

  return response.data;
};

// Get passenger ride history
export const getPassengerRides = async (page = 1, limit = 10) => {
  const response = await API.get("/rides", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
};

export const getCurrentPassengerRide = async () => {
  const response = await API.get("/rides");

  return response.data;
};
