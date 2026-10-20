const RIDE_STATES = {
  REQUESTED: "REQUESTED",
  SEARCHING: "SEARCHING",
  DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
  DRIVER_ARRIVING: "DRIVER_ARRIVING",
  DRIVER_ARRIVED: "DRIVER_ARRIVED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
};

const ALLOWED_TRANSITIONS = {
  REQUESTED: ["SEARCHING", "CANCELLED"],
  SEARCHING: ["DRIVER_ASSIGNED", "CANCELLED"],
  DRIVER_ASSIGNED: ["DRIVER_ARRIVING", "CANCELLED"],
  DRIVER_ARRIVING: ["DRIVER_ARRIVED", "CANCELLED"],
  DRIVER_ARRIVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

export const isValidRideTransition = (currentState, nextState) => {
  const allowedStates = ALLOWED_TRANSITIONS[currentState];
  if (!allowedStates) {
    return false;
  }
  return allowedStates.includes(nextState);
};

export const getAllowedNextStates = (currentState) => {
  return ALLOWED_TRANSITIONS[currentState] || [];
};

export { RIDE_STATES };
