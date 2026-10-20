import mongoose from "mongoose";

const driverLocationSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
      unique: true,
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

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

driverLocationSchema.index({
  location: "2dsphere",
});

const DriverLocation = mongoose.model("DriverLocation", driverLocationSchema);

export default DriverLocation;
