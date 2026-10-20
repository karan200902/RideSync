import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import connectDB from "../config/database.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@12345", 12);

    const admin = await User.create({
      name: "RideSync Admin",
      email: "admin@ridesync.com",
      phone: "9999999999",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created:", admin.email);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }
};

createAdmin();
