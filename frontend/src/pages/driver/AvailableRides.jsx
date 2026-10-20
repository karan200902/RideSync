import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableRides, acceptRide } from "../../api/driverApi.js";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function formatAddress(location) {
  return location?.address || "Address unavailable";
}

function AvailableRides() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["availableRides"],
    queryFn: getAvailableRides,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptRide,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["availableRides"] }),
        queryClient.invalidateQueries({ queryKey: ["activeRide"] }),
        queryClient.invalidateQueries({ queryKey: ["driverProfile"] }),
      ]);
    },
  });

  // The driver API returns Axios response.data.
  // The backend wraps available rides inside data.rides.
  const rides = data?.data?.rides ?? [];

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Available Rides
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Find nearby opportunities and accept your next trip.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetching ? "Refreshing..." : "Refresh rides"}
          </button>
        </div>

        {acceptMutation.isError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
          >
            {acceptMutation.error?.response?.data?.message ||
              acceptMutation.error?.message ||
              "Unable to accept this ride. Please try again."}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500" />
            <p className="text-gray-400">Loading available rides...</p>
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-900 bg-gray-900 p-8 text-center">
            <h2 className="text-lg font-semibold text-red-300">
              Could not load rides
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while fetching rides."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-500"
            >
              Try again
            </button>
          </div>
        ) : rides.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl">
              ↗
            </div>
            <h2 className="text-xl font-semibold">No rides available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
              There are no matching ride requests right now. New requests will
              appear automatically when they become available.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">{rides.length}</span>{" "}
                available {rides.length === 1 ? "ride" : "rides"}
              </p>
              <span className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Auto-refreshing
              </span>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {rides.map((ride) => {
                const rideId = ride._id;
                const isAccepting =
                  acceptMutation.isPending &&
                  acceptMutation.variables === rideId;

                return (
                  <article
                    key={rideId}
                    className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-lg shadow-black/10 transition hover:border-gray-700 sm:p-6"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full border border-blue-900 bg-blue-950/60 px-3 py-1 text-xs font-medium capitalize text-blue-300">
                          {ride.vehicleType}
                        </span>
                        <p className="mt-3 text-sm text-gray-400">
                          Ride request
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-gray-500">
                          #{rideId}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          Estimated fare
                        </p>
                        <p className="mt-1 text-2xl font-bold text-green-400">
                          {formatCurrency(ride.estimatedFare)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5 rounded-xl bg-gray-950/70 p-4">
                      <div className="flex gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <span className="h-3 w-3 rounded-full border-2 border-green-400" />
                          <span className="my-1 h-8 border-l border-dashed border-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Pickup
                          </p>
                          <p className="mt-1 break-words text-sm text-gray-200">
                            {formatAddress(ride.pickup)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="mt-1 h-3 w-3 shrink-0 rounded-sm bg-red-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Destination
                          </p>
                          <p className="mt-1 break-words text-sm text-gray-200">
                            {formatAddress(ride.destination)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="my-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gray-800 p-3">
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="mt-1 font-semibold text-gray-200">
                          {Number(ride.distance ?? 0).toFixed(2)} km
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-800 p-3">
                        <p className="text-xs text-gray-500">Est. duration</p>
                        <p className="mt-1 font-semibold text-gray-200">
                          {Math.round(ride.estimatedDuration ?? 0)} min
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={acceptMutation.isPending}
                      onClick={() => acceptMutation.mutate(rideId)}
                      className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAccepting
                        ? "Accepting ride..."
                        : acceptMutation.isPending
                          ? "Please wait..."
                          : "Accept Ride"}
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AvailableRides;