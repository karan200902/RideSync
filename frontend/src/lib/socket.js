import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        return null;
    }

    if (socket?.connected) {
        return socket;
    }

    socket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: {
            token,
        },
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
        console.error(
            "Socket connection error:",
            error.message
        );
    });

    socket.on("disconnect", (reason) => {
        console.log(
            "Socket disconnected:",
            reason
        );
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const joinRideRoom = (rideId) => {
    if (!socket?.connected) {
        console.warn(
            "Socket is not connected. Cannot join ride room."
        );

        return;
    }

    socket.emit("ride:join", {
        rideId,
    });
};

export const leaveRideRoom = (rideId) => {
    if (!socket?.connected) {
        return;
    }

    socket.emit("ride:leave", {
        rideId,
    });
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};