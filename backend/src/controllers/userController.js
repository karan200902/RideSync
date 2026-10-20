import asyncHandler from "../utils/asyncHandler.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user",
    data: {
      user: req.user,
    },
  });
});