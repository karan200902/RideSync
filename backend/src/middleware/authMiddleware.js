import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import asyncHandler from "../utils/asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  let decoded;

  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw new AppError("Invalid or expired access token", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  
  req.user = user;
  console.log("Authenticated user:", req.user);

  next();
});

export default authenticate;