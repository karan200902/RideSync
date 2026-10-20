import { useEffect } from "react";

import {
  connectSocket,
  disconnectSocket,
} from "../lib/socket.js";

const useDriverLocation = (isOnline) => {
  useEffect(() => {
    if (!isOnline) {
      disconnectSocket();
      return;
    }

    if (!navigator.geolocation) {
      console.error(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    const socket = connectSocket();

    if (!socket) {
      console.error(
        "Unable to connect to location socket."
      );
      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const {
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          } = position.coords;

          console.log(
            "Sending driver location:",
            {
              latitude,
              longitude,
            }
          );

          if (!socket.connected) {
            console.warn("Socket not connected. Location not sent.");
            return;
          }
          socket.emit("driver:location", {
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          });
        },
        (error) => {
          console.error(
            "Driver location error:",
            error
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      disconnectSocket();
    };
  }, [isOnline]);
};

export default useDriverLocation;