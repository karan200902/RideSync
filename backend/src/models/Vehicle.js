import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
      unique: true,
    },

    registrationNumber: {
      type: String,
      required: [true, "Vehicle registration number is required"],
      trim: true,
      uppercase: true,
    },

    vehicleType: {
      type: String,
      enum: ["car", "bike", "auto"],
      required: [true, "Vehicle type is required"],
    },

    make: {
      type: String,
      required: [true, "Vehicle make is required"],
      trim: true,
      maxlength: [50, "Vehicle make cannot exceed 50 characters"],
    },

    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
      maxlength: [50, "Vehicle model cannot exceed 50 characters"],
    },

    color: {
      type: String,
      required: [true, "Vehicle color is required"],
      trim: true,
      maxlength: [30, "Vehicle color cannot exceed 30 characters"],
    },

    year: {
      type: Number,
      required: [true, "Vehicle year is required"],
      min: [2000, "Vehicle year must be 2000 or later"],
      max: [
        new Date().getFullYear() + 1,
        "Vehicle year cannot be in the future",
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;