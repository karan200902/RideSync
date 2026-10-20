import Ride from "../models/Ride.js";
import AppError from "../utils/AppError.js";
import { isValidRideTransition } from "../utils/rideStateMachine.js";

const getTransitionUpdates = (nextState) => {
  const updates = {};
  const now = new Date();
  if (nextState === "DRIVER_ASSIGNED") {
    updates.assignedAt = now;
  }
  if (nextState === "IN_PROGRESS") {
    updates.startedAt = now;
  }
  if (nextState === "COMPLETED") {
    updates.completedAt = now;
  }
  return updates;
};

export const transitionRideState = async (
  rideId,
  currentState,
  nextState,
  additionalUpdates = {},
) => {
  const isValid = isValidRideTransition(currentState, nextState);
  if (!isValid) {
    throw new AppError(
      `Invalid ride transition: ${currentState} → ${nextState}`,
      400,
    );
  }

  const transitionUpdates = getTransitionUpdates(nextState);

  const ride = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: currentState,
    },
    {
      $set: {
        status: nextState,
        ...transitionUpdates,
        ...additionalUpdates,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!ride) {
    throw new AppError("Ride state changed already or ride not found", 409);
  }

  return ride;
};
