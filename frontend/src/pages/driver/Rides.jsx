import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDriverRides } from "../../api/driverApi.js";

const statuses = [
  { label: "All rides", value: "" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Paid", value: "PAID" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Payment pending", value: "PAYMENT_PENDING" },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status = "") {
  return status.replaceAll("_", " ");
}

function statusClasses(status) {
  if (["PAID", "COMPLETED"].includes(status)) {
    return "bg-green-950 text-green-300 border-green-900";
  }

  if (["CANCELLED", "FAILED"].includes(status)) {
    return "bg-red-950 text-red-300 border-red-900";
  }

  if (["IN_PROGRESS", "DRIVER_ARRIVING", "DRIVER_ARRIVED"].includes(status)) {
    return "bg-blue-950 text-blue-300 border-blue-900";
  }

  return "bg-yellow-950 text-yellow-300 border-yellow-900";
}

function Rides() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["driverRides", page, status],
    queryFn: () => getDriverRides({ page, limit: 10, status }),
    refetchOnWindowFocus: true,
  });

  const result = data?.data;
  const rides = result?.rides ?? [];
  const pagination = result?.pagination;

  function changeStatus(value) {
    setStatus(value);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {" "}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold tracking-tight">My Rides</h1>{" "}
          <p className="mt-2 text-sm text-gray-400">
            Review your trips, ride statuses, and fares.{" "}
          </p>{" "}
        </div>
        ```
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-800 disabled:opacity-50"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            onClick={() => changeStatus(item.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              status === item.value
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-gray-800 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-400">
          Loading your rides...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-900 bg-gray-900 p-8">
          <h2 className="font-semibold text-red-300">
            Could not load your rides
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Try again
          </button>
        </div>
      ) : rides.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl">
            ↗
          </div>
          <h2 className="text-xl font-semibold">No rides found</h2>
          <p className="mt-2 text-sm text-gray-400">
            {status
              ? `You don't have any rides with status "${formatStatus(status)}".`
              : "Your accepted rides will appear here."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-semibold text-white">{rides.length}</span>{" "}
            rides
            {typeof pagination?.total === "number" && (
              <> out of {pagination.total} total</>
            )}
          </p>

          <div className="space-y-4">
            {rides.map((ride) => {
              const fare = ride.finalFare ?? ride.estimatedFare ?? 0;

              return (
                <article
                  key={ride._id}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Ride ID: {ride._id}
                      </p>
                      <p className="mt-2 text-lg font-semibold capitalize">
                        {ride.vehicleType || "Ride"} trip
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {formatDate(ride.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses(ride.status)}`}
                      >
                        {formatStatus(ride.status)}
                      </span>
                      <p className="mt-3 text-xs text-gray-400">
                        {ride.finalFare != null
                          ? "Final fare"
                          : "Estimated fare"}
                      </p>
                      <p className="mt-1 text-xl font-bold text-green-400">
                        {formatCurrency(fare)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 rounded-xl bg-gray-950/70 p-4">
                    <div className="flex gap-3">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-green-400" />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Pickup
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-200">
                          {ride.pickup?.address || "Address unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-sm bg-red-400" />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Destination
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-200">
                          {ride.destination?.address || "Address unavailable"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-800 p-3">
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="mt-1 font-medium text-gray-200">
                        {Number(ride.distance ?? 0).toFixed(2)} km
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-800 p-3">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="mt-1 font-medium text-gray-200">
                        {Math.round(ride.estimatedDuration ?? 0)} min
                      </p>
                    </div>

                    <div className="col-span-2 rounded-lg border border-gray-800 p-3 sm:col-span-1">
                      <p className="text-xs text-gray-500">Last updated</p>
                      <p className="mt-1 text-sm font-medium text-gray-200">
                        {formatDate(ride.updatedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Rides;
