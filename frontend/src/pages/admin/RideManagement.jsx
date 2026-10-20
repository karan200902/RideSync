import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios.js";

const RIDE_STATUSES = [
  "REQUESTED",
  "SEARCHING",
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "PAYMENT_PENDING",
  "PAID",
  "CANCELLED",
];

function formatStatus(status = "") {
  return status.replaceAll("_", " ");
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString();
}

function formatCurrency(amount) {
  if (amount == null) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusStyle(status) {
  if (status === "PAID" || status === "COMPLETED") {
    return "bg-green-500/15 text-green-400";
  }

  if (status === "CANCELLED") {
    return "bg-red-500/15 text-red-400";
  }

  if (status === "IN_PROGRESS") {
    return "bg-blue-500/15 text-blue-400";
  }

  return "bg-yellow-500/15 text-yellow-400";
}

export default function RideManagement() {
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRides: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/rides/manage", {
        params: {
          search: search.trim(),
          status,
          vehicleType,
          page,
          limit: 10,
        },
      });

      const result = response.data?.data;

      setRides(result?.rides ?? []);
      setPagination(
        result?.pagination ?? {
          currentPage: 1,
          totalPages: 0,
          totalRides: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load rides. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, vehicleType, page]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    fetchRides();
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setVehicleType("all");
    setPage(1);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Ride Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Monitor rides across the RideSync platform.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRides}
          disabled={loading}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Total matching rides</p>
          <p className="mt-2 text-2xl font-semibold">
            {pagination.totalRides}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Current page</p>
          <p className="mt-2 text-2xl font-semibold">
            {pagination.currentPage}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Total pages</p>
          <p className="mt-2 text-2xl font-semibold">
            {pagination.totalPages}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 md:grid-cols-4"
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search address, passenger, driver..."
          maxLength={100}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2"
        />

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {RIDE_STATUSES.map((rideStatus) => (
            <option key={rideStatus} value={rideStatus}>
              {formatStatus(rideStatus)}
            </option>
          ))}
        </select>

        <select
          value={vehicleType}
          onChange={(event) => {
            setVehicleType(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
        >
          <option value="all">All vehicle types</option>
          <option value="bike">Bike</option>
          <option value="auto">Auto</option>
          <option value="car">Car</option>
        </select>

        <div className="flex gap-2 md:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Search
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
          >
            Clear filters
          </button>
        </div>
      </form>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchRides}
            className="underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-gray-800 bg-gray-950 text-gray-400">
            <tr>
              <th className="px-4 py-3">Ride</th>
              <th className="px-4 py-3">Passenger</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Fare</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  Loading rides...
                </td>
              </tr>
            ) : rides.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No rides found.
                </td>
              </tr>
            ) : (
              rides.map((ride) => (
                <tr
                  key={ride._id}
                  className="align-top hover:bg-gray-800/40"
                >
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      #{ride._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {ride._id}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p>{ride.passenger?.name || "Unknown"}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {ride.passenger?.email || "—"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p>{ride.driver?.user?.name || "Not assigned"}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {ride.driver?.user?.email || "—"}
                    </p>
                  </td>

                  <td className="max-w-xs px-4 py-4">
                    <p className="break-words">
                      <span className="text-green-400">From:</span>{" "}
                      {ride.pickup?.address || "—"}
                    </p>
                    <p className="mt-2 break-words">
                      <span className="text-red-400">To:</span>{" "}
                      {ride.destination?.address || "—"}
                    </p>
                  </td>

                  <td className="px-4 py-4 capitalize">
                    {ride.vehicleType || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <p>{formatCurrency(ride.finalFare)}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Est. {formatCurrency(ride.estimatedFare)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(ride.status)}`}
                    >
                      {formatStatus(ride.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-gray-400">
                    {formatDate(ride.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-400">
          Showing {rides.length} rides on page {pagination.currentPage} of{" "}
          {pagination.totalPages}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}