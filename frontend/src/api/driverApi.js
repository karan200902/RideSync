import API from "./axios.js";

// --------------------------------------------------
// Driver Profile
// --------------------------------------------------

export const getDriverProfile = async () => {
  const response = await API.get("/drivers/me");

  return response.data;
};

export const updateDriverStatus = async (isOnline) => {
  const response = await API.patch("/drivers/status", {
    isOnline,
  });

  return response.data;
};


// --------------------------------------------------
// Vehicle
// --------------------------------------------------

export const getDriverVehicle = async () => {
  const response = await API.get("/drivers/vehicle");

  return response.data;
};

export const createDriverVehicle = async (vehicleData) => {
  const response = await API.post("/drivers/vehicle", vehicleData);

  return response.data;
};

export const updateDriverVehicle = async (vehicleData) => {
  const response = await API.patch("/drivers/vehicle", vehicleData);

  return response.data;
};

export const deleteDriverVehicle = async () => {
  const response = await API.delete("/drivers/vehicle");

  return response.data;
};

// --------------------------------------------------
// Driver Ride Lifecycle
// --------------------------------------------------

export const getActiveRide = async () => {
  const response = await API.get("/driver/rides/active");

  return response.data;
};

export const getAvailableRides = async () => {
  const response = await API.get("/driver/rides/available");

  return response.data;
};

export const acceptRide = async (rideId) => {
  const response = await API.patch(`/driver/rides/${rideId}/accept`);

  return response.data;
};

export const startDriverArrival = async (rideId) => {
  const response = await API.patch(`/driver/rides/${rideId}/arriving`);

  return response.data;
};

export const markDriverArrived = async (rideId) => {
  const response = await API.patch(`/driver/rides/${rideId}/arrived`);

  return response.data;
};

export const startTrip = async (rideId) => {
  const response = await API.patch(`/driver/rides/${rideId}/start`);

  return response.data;
};

export const completeTrip = async (rideId) => {
  const response = await API.patch(`/driver/rides/${rideId}/complete`);

  return response.data;
};

export const getDriverRides = async ({
  page = 1,
  limit = 10,
  status = "",
} = {}) => {
  const response = await API.get("/driver/rides", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  });

  return response.data;
};


export const getDriverEarnings = async ({
  page = 1,
  limit = 10,
  status = "",
} = {}) => {
  const response = await API.get("/driver/rides/earnings", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  });

  return response.data;
};