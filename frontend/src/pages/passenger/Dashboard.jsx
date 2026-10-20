import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

import QuickActionCard from "../../components/passenger/QuickActionCard.jsx";
import RideCard from "../../components/passenger/RideCard.jsx";
import CurrentRideCard from "../../components/passenger/CurrentRideCard.jsx";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const recentRides = [];

  const currentRide = null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-blue-400">Passenger Dashboard</p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Welcome back, {user?.name || "Passenger"} 👋
        </h1>

        <p className="mt-2 text-gray-400">Where would you like to go today?</p>
      </div>

      {/* Request Ride */}
      <section>
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 shadow-lg">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-100">
              Ready to travel?
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Request your next ride
            </h2>

            <p className="mt-2 text-sm text-blue-100">
              Enter your pickup and destination to find a nearby driver.
            </p>

            <button
              onClick={() => navigate("/passenger/request-ride")}
              className="mt-5 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Request a Ride →
            </button>
          </div>
        </div>
      </section>

      {/* Current Ride */}
      <section>
        <CurrentRideCard ride={currentRide} />
      </section>

      {/* Quick Actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>

          <p className="mt-1 text-sm text-gray-400">
            Manage your rides and account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <QuickActionCard
            title="Request a Ride"
            description="Find a driver and start your journey."
            icon="🚗"
            onClick={() => navigate("/passenger/request-ride")}
          />

          <QuickActionCard
            title="Ride History"
            description="View your previous rides and payments."
            icon="🕒"
            onClick={() => navigate("/passenger/rides")}
          />

          <QuickActionCard
            title="Profile"
            description="Manage your personal account details."
            icon="👤"
            onClick={() => navigate("/passenger/profile")}
          />
        </div>
      </section>

      {/* Recent Rides */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Rides</h2>

            <p className="mt-1 text-sm text-gray-400">
              Your latest ride activity.
            </p>
          </div>

          <button
            onClick={() => navigate("/passenger/rides")}
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all
          </button>
        </div>

        {recentRides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-8 text-center">
            <div className="text-3xl">🚕</div>

            <h3 className="mt-3 font-medium text-white">No rides yet</h3>

            <p className="mt-1 text-sm text-gray-500">
              Your completed rides will appear here.
            </p>

            <button
              onClick={() => navigate("/passenger/request-ride")}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Book Your First Ride
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
