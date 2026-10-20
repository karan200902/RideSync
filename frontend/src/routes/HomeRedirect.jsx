import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Home from "../pages/Home.jsx";

function HomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // No token / invalid token
  if (!isAuthenticated) {
    return <Home />;
  }

  // Valid token → dashboard
  if (user?.role === "driver") {
    return <Navigate to="/driver" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/passenger" replace />;
}

export default HomeRedirect;
