import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";
import driverRideRoutes from "./routes/driverRideRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

//Health
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RideSync API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/drivers", driverRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/rides", rideRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/driver/rides", driverRideRoutes);
app.use("/api/v1/payments", paymentRoutes);

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;
