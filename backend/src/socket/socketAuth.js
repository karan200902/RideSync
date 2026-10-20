import jwt from "jsonwebtoken";

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    socket.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);

    next(new Error("Invalid or expired token"));
  }
};

export default socketAuth;
