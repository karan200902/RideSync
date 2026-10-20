import { useEffect, useState } from "react";
import API from "../../api/axios.js";

const formatNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN").format(value);

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date) =>
  new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusStyles = {
  PAID: "bg-emerald-500/10 text-emerald-400",
  CANCELLED: "bg-red-500/10 text-red-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-400",
  PAYMENT_PENDING: "bg-amber-500/10 text-amber-400",
  DRIVER_ASSIGNED: "bg-violet-500/10 text-violet-400",
};

function StatCard({ label, value, detail, accent = "blue" }) {
  const accents = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    violet: "bg-violet-500/10 text-violet-400",
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-gray-500">{detail}</p>
        </div>

        <div
          className={`rounded-xl px-3 py-2 text-xs font-semibold ${accents[accent]}`}
        >
          {label.split(" ")[0]}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/admin/overview");

        if (isMounted) {
          setOverview(response.data?.data?.overview ?? null);
          setRecentRides(response.data?.data?.recentRides ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard statistics.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <p className="text-gray-400">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <h2 className="font-semibold text-red-400">Dashboard could not load</h2>
        <p className="mt-2 text-sm text-gray-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = overview ?? {};

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            RIDESYNC ADMINISTRATION
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-400">
            Monitor platform activity, drivers, rides, and payments.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
        >
          Refresh data
        </button>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Platform overview</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={formatNumber(stats.totalUsers)}
            detail="Passenger and driver accounts"
            accent="blue"
          />
          <StatCard
            label="Total drivers"
            value={formatNumber(stats.totalDrivers)}
            detail={`${formatNumber(stats.onlineDrivers)} currently online`}
            accent="green"
          />
          <StatCard
            label="Pending verification"
            value={formatNumber(stats.pendingDrivers)}
            detail="Drivers awaiting review"
            accent="amber"
          />
          <StatCard
            label="Successful payments"
            value={formatCurrency(stats.totalRevenue)}
            detail="Total value of successful payments"
            accent="violet"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Ride statistics</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total rides"
            value={formatNumber(stats.totalRides)}
            detail="All recorded rides"
          />
          <StatCard
            label="Active rides"
            value={formatNumber(stats.activeRides)}
            detail="Including rides awaiting payment"
            accent="violet"
          />
          <StatCard
            label="Completed rides"
            value={formatNumber(stats.completedRides)}
            detail="Successfully paid rides"
            accent="green"
          />
          <StatCard
            label="Cancelled rides"
            value={formatNumber(stats.cancelledRides)}
            detail="Rides marked cancelled"
            accent="amber"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 px-5 py-4">
          <h2 className="text-lg font-semibold">Recent rides</h2>
          <p className="mt-1 text-sm text-gray-400">
            The five most recently created rides.
          </p>
        </div>

        {recentRides.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">
            No rides have been created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-950/60 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Passenger</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Fare</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {recentRides.map((ride) => (
                  <tr key={ride._id} className="hover:bg-gray-800/40">
                    <td className="px-5 py-4 font-medium text-gray-200">
                      {ride.passenger?.name ?? "Unknown"}
                    </td>
                    <td className="px-5 py-4 capitalize text-gray-300">
                      {ride.vehicleType}
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {formatCurrency(ride.finalFare ?? ride.estimatedFare)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[ride.status] ??
                          "bg-gray-700/60 text-gray-300"
                        }`}
                      >
                        {ride.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {formatDate(ride.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
