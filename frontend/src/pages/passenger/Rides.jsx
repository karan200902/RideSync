import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPassengerRides } from "../../api/rideApi.js";

const STATUS_STYLES = {
  REQUESTED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  SEARCHING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DRIVER_ASSIGNED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DRIVER_ARRIVING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  DRIVER_ARRIVED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  IN_PROGRESS: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
  PAYMENT_PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PAID: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatFare = (fare) => {
  if (fare === null || fare === undefined) {
    return "—";
  }

  return `₹${Number(fare).toFixed(2)}`;
};

function Rides() {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPassengerRides(page, 10);

        const data = response?.data;

        setRides(data?.rides || []);

        setPagination({
          page: data?.pagination?.page || page,
          limit: data?.pagination?.limit || 10,
          total: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 1,
        });
      } catch (err) {
        console.error("Failed to fetch ride history:", err);

        setError(
          err?.response?.data?.message || "Unable to load your ride history.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [page]);

  const handlePrevious = () => {
    if (page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
  };

  const handleNext = () => {
    if (page < pagination.totalPages) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Ride History</h1>

          <p className="mt-1 text-sm text-gray-400">
            View all your previous and current rides.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/passenger/request-ride")}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Request New Ride
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
          <p className="text-gray-400">Loading ride history...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400">{error}</p>

          <button
            type="button"
            onClick={() => setPage(page)}
            className="mt-4 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rides.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <span className="text-2xl">🚕</span>
          </div>

          <h2 className="text-lg font-semibold text-white">No rides yet</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Your completed and previous rides will appear here.
          </p>

          <button
            type="button"
            onClick={() => navigate("/passenger/request-ride")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Request Your First Ride
          </button>
        </div>
      )}

      {/* Ride list */}
      {!loading && !error && rides.length > 0 && (
        <>
          <div className="space-y-4">
            {rides.map((ride) => {
              const statusClass =
                STATUS_STYLES[ride.status] ||
                "bg-gray-500/10 text-gray-400 border-gray-500/20";

              return (
                <button
                  key={ride._id}
                  type="button"
                  onClick={() => navigate(`/passenger/rides/${ride._id}`)}
                  className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-5 text-left transition hover:border-gray-700 hover:bg-gray-900/80"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Route */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <div className="h-8 border-l border-dashed border-gray-600" />
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                        </div>

                        <div className="min-w-0 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500">Pickup</p>

                            <p className="truncate text-sm text-gray-200">
                              {ride.pickup?.address || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Destination</p>

                            <p className="truncate text-sm text-gray-200">
                              {ride.destination?.address || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ride information */}
                    <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
                      >
                        {formatStatus(ride.status)}
                      </span>

                      <p className="text-lg font-semibold text-white">
                        {formatFare(ride.finalFare ?? ride.estimatedFare)}
                      </p>

                      <p className="text-xs text-gray-500">
                        {formatDate(ride.requestedAt || ride.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Bottom information */}
                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-800 pt-4 text-xs text-gray-500">
                    <span>
                      Vehicle:{" "}
                      <span className="capitalize text-gray-300">
                        {ride.vehicleType || "—"}
                      </span>
                    </span>

                    <span>
                      Distance:{" "}
                      <span className="text-gray-300">
                        {ride.distance != null
                          ? `${Number(ride.distance).toFixed(2)} km`
                          : "—"}
                      </span>
                    </span>

                    <span>
                      Duration:{" "}
                      <span className="text-gray-300">
                        {ride.estimatedDuration != null
                          ? `${Number(ride.estimatedDuration).toFixed(0)} min`
                          : "—"}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900 px-5 py-4">
            <p className="text-sm text-gray-400">
              Page{" "}
              <span className="font-medium text-white">{pagination.page}</span>{" "}
              of{" "}
              <span className="font-medium text-white">
                {pagination.totalPages}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={handlePrevious}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={handleNext}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Rides;
