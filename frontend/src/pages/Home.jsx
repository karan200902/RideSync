import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  // If a valid token exists, don't show Login/Register.
  if (isAuthenticated && user) {
    if (user.role === "driver") {
      window.location.href = "/driver";
    } else if (user.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/passenger";
    }

    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
          RideSync
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Your ride, your way.
        </h1>

        <p className="mt-6 text-lg text-gray-400">
          A reliable ride-sharing platform connecting passengers with verified
          drivers.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg border border-gray-700 px-6 py-3 font-medium transition hover:bg-gray-900"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Home;
