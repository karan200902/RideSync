import { Server } from "socket.io";

import socketAuth from "./socketAuth.js";

import DriverProfile from "../models/DriverProfile.js";
import DriverLocation from "../models/DriverLocation.js";
import Ride from "../models/Ride.js";

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.user.userId}`
    );

    /*
     * JOIN RIDE ROOM
     */
    socket.on("ride:join", async ({ rideId }) => {
      try {
        if (!rideId) {
          return;
        }

        const ride = await Ride.findById(rideId)
          .select("passenger driver");

        if (!ride) {
          socket.emit("ride:error", {
            message: "Ride not found",
          });

          return;
        }

        const isPassenger =
          ride.passenger?.toString() === socket.user.userId;

        let isDriver = false;

        if (ride.driver) {
          const driverProfile = await DriverProfile.findById(
            ride.driver
          ).select("user");

          isDriver =
            driverProfile?.user?.toString() ===
            socket.user.userId;
        }

        if (!isPassenger && !isDriver) {
          socket.emit("ride:error", {
            message: "You are not authorized to join this ride",
          });

          return;
        }

        const room = `ride:${rideId}`;

        socket.join(room);

        console.log(
          `Socket ${socket.id} joined ${room}`
        );

        socket.emit("ride:joined", {
          rideId,
        });

      } catch (error) {
        console.error(
          "Ride room join error:",
          error
        );
      }
    });

    /*
     * LEAVE RIDE ROOM
     */
    socket.on("ride:leave", ({ rideId }) => {
      if (!rideId) {
        return;
      }

      const room = `ride:${rideId}`;

      socket.leave(room);

      console.log(
        `Socket ${socket.id} left ${room}`
      );
    });

    /*
     * DRIVER LOCATION
     */
    socket.on("driver:location", async (location) => {
      try {
        if (socket.user.role !== "driver") {
          return;
        }

        const {
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
        } = location;

        if (
          typeof latitude !== "number" ||
          latitude < -90 ||
          latitude > 90
        ) {
          return;
        }

        if (
          typeof longitude !== "number" ||
          longitude < -180 ||
          longitude > 180
        ) {
          return;
        }

        const driver = await DriverProfile.findOne({
          user: socket.user.userId,
        });

        if (!driver) {
          return;
        }

        if (!driver.isOnline) {
          return;
        }

        await DriverLocation.findOneAndUpdate(
          {
            driver: driver._id,
          },
          {
            $set: {
              location: {
                type: "Point",
                coordinates: [
                  longitude,
                  latitude,
                ],
              },
              lastUpdatedAt: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        /*
         * Find driver's active ride
         */
        if (driver.activeRide) {
          const ride = await Ride.findById(
            driver.activeRide
          ).select("_id passenger status");

          if (ride) {
            const room = `ride:${ride._id}`;

            /*
             * Send location to passenger
             */
            io.to(room).emit(
              "driver:location:update",
              {
                rideId: ride._id,
                latitude,
                longitude,
                accuracy,
                speed,
                heading,
                timestamp: Date.now(),
              }
            );
          }
        }

      } catch (error) {
        console.error(
          "Driver location socket error:",
          error
        );
      }
    });

    /*
     * DISCONNECT
     */
    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} | Reason: ${reason}`
      );
    });
  });

  return io;
};

export default initializeSocket;