import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import DriverProfile from "../models/DriverProfile.js";
import Vehicle from "../models/Vehicle.js";

import AppError from "../utils/AppError.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

export const registerUser = async (userData) => {
  const { name, email, phone, password } = userData;

  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    throw new AppError("Email is already registered", 409);
  }

  const existingPhone = await User.findOne({ phone });

  if (existingPhone) {
    throw new AppError("Phone number is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "passenger",
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.password = undefined;

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  const accessToken = generateAccessToken(user);

  return accessToken;
};

export const registerDriver = async ({
  name,
  email,
  phone,
  password,
  licenseNumber,
  vehicle,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    }).session(session);

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError("Email is already registered", 409);
      }

      throw new AppError("Phone number is already registered", 409);
    }

    const existingLicense = await DriverProfile.findOne({
      licenseNumber: licenseNumber.toUpperCase(),
    }).session(session);

    if (existingLicense) {
      throw new AppError("License number is already registered", 409);
    }

    const existingVehicle = await Vehicle.findOne({
      registrationNumber: vehicle.registrationNumber.toUpperCase(),
    }).session(session);

    if (existingVehicle) {
      throw new AppError(
        "Vehicle registration number is already registered",
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await User.create(
      [
        {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "driver",
        },
      ],
      { session },
    );

    const [driverProfile] = await DriverProfile.create(
      [
        {
          user: user._id,
          licenseNumber: licenseNumber.toUpperCase(),
          verificationStatus: "pending",
        },
      ],
      { session },
    );

    const [createdVehicle] = await Vehicle.create(
      [
        {
          driver: driverProfile._id,
          registrationNumber: vehicle.registrationNumber.toUpperCase(),
          vehicleType: vehicle.vehicleType,
          make: vehicle.make,
          model: vehicle.model,
          color: vehicle.color,
          year: vehicle.year,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    user.password = undefined;

    return {
      user,
      driverProfile,
      vehicle: createdVehicle,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const updateUserProfile = async (userId, updateData) => {
  const { name, phone } = updateData;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (phone !== undefined) {
    const existingUser = await User.findOne({
      phone,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new AppError("Phone number is already in use", 409);
    }

    user.phone = phone;
  }

  await user.save();

  return user;
};

export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isPasswordCorrect) {
    throw new AppError("Current password is incorrect", 401);
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;

  await user.save();

  return true;
};
