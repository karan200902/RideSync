import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xl font-bold text-white"
        >
          Ride<span className="text-blue-500">Sync</span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">
              {user?.name}
            </p>

            <p className="text-xs capitalize text-gray-500">
              {user?.role}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;