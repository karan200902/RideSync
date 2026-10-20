import {
  registerUser,
  loginUser,
  refreshAccessToken,
  registerDriver as registerDriverService,
  updateUserProfile,
  changeUserPassword,
} from "../services/authService.js";

import asyncHandler from "../utils/asyncHandler.js";
import { refreshTokenCookieOptions } from "../utils/cookieOptions.js";


export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  // Log the new user in to issue tokens after registration.
  const { accessToken, refreshToken } = await loginUser(
    req.body.email,
    req.body.password
  );

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user,
      accessToken,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginUser(email, password);

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user,
      accessToken,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  const accessToken = await refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed",
    data: {
      accessToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: refreshTokenCookieOptions.httpOnly,
    secure: refreshTokenCookieOptions.secure,
    sameSite: refreshTokenCookieOptions.sameSite,
  });

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const registerDriver = asyncHandler(async (req, res) => {
  const { name, email, phone, password, licenseNumber, vehicle } = req.body;

  const result = await registerDriverService({
    name,
    email,
    phone,
    password,
    licenseNumber,
    vehicle,
  });

  res.status(201).json({
    success: true,
    message: "Driver registration successful",
    data: result,
  });
});

export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      user: req.user,
    },
  });
};

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await changeUserPassword(req.user._id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
