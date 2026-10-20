import mongoose from "mongoose";

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      trim: true,
      uppercase: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },

    totalRides: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },
    activeRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
      index: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  {
    timestamps: true,
  },
);

driverProfileSchema.index({
  currentLocation: "2dsphere",
});

const DriverProfile = mongoose.model("DriverProfile", driverProfileSchema);

export default DriverProfile;
