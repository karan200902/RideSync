import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      default: null,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["bike", "auto", "car"],
      required: true,
    },
    pickup: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    destination: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },

        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedDuration: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedFare: {
      type: Number,
      required: true,
      min: 0,
    },
    finalFare: {
      type: Number,
      default: null,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "SEARCHING",
        "DRIVER_ASSIGNED",
        "DRIVER_ARRIVING",
        "DRIVER_ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "PAYMENT_PENDING",
        "PAID",
        "CANCELLED",
      ],
      default: "REQUESTED",
      index: true,
    },
    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },

    cancelledBy: {
      type: String,
      enum: ["passenger", "driver", "system", null],
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

rideSchema.index({
  "pickup.location": "2dsphere",
});

rideSchema.index({
  "destination.location": "2dsphere",
});

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
