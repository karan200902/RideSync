import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useDriverLocation from "../../hooks/useDriverLocation.js";

import {
  getDriverProfile,
  updateDriverStatus,
  getAvailableRides,
  acceptRide,
  startDriverArrival,
  markDriverArrived,
  startTrip,
  completeTrip,
  getActiveRide,
} from "../../api/driverApi.js";

function Dashboard() {
  const queryClient = useQueryClient();

  // ==============================
  // DRIVER PROFILE
  // ==============================

  const {
    data: profileResponse,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorData,
  } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: getDriverProfile,
  });

  console.log("DRIVER PROFILE RESPONSE:", profileResponse);

  const driverProfile =
    profileResponse?.data?.driver ||
    profileResponse?.data?.profile ||
    profileResponse?.driver ||
    profileResponse?.profile ||
    null;

  useDriverLocation(driverProfile?.isOnline === true);

  // ==============================
  // ACTIVE RIDE
  // ==============================

  const {
    data: activeRideResponse,
    isLoading: activeRideLoading,
    isError: activeRideError,
    error: activeRideErrorData,
  } = useQuery({
    queryKey: ["driver-active-ride"],
    queryFn: getActiveRide,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  console.log("ACTIVE RIDE RESPONSE:", activeRideResponse);

  const activeRide = activeRideResponse?.data?.ride || null;

  // ==============================
  // AVAILABLE RIDES
  // ==============================

  const {
    data: availableResponse,
    isLoading: availableLoading,
    isError: availableError,
    error: availableErrorData,
  } = useQuery({
    queryKey: ["driver-available-rides"],
    queryFn: getAvailableRides,

    enabled: driverProfile?.isOnline === true && !activeRide,

    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  console.log("AVAILABLE RIDES RESPONSE:", availableResponse);

  const availableRides = availableResponse?.data?.rides || [];

  // ==============================
  // ONLINE / OFFLINE
  // ==============================

  const statusMutation = useMutation({
    mutationFn: updateDriverStatus,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["driver-profile"],
      });

      queryClient.invalidateQueries({
        queryKey: ["driver-available-rides"],
      });
    },
  });

  const toggleOnlineStatus = () => {
    if (!driverProfile) return;

    statusMutation.mutate(!driverProfile.isOnline);
  };

  // ==============================
  // ACCEPT RIDE
  // ==============================

  const acceptMutation = useMutation({
    mutationFn: acceptRide,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["driver-active-ride"],
      });

      queryClient.invalidateQueries({
        queryKey: ["driver-available-rides"],
      });

      queryClient.invalidateQueries({
        queryKey: ["driver-profile"],
      });
    },
  });

  // ==============================
  // ARRIVING
  // ==============================

  const arrivingMutation = useMutation({
    mutationFn: startDriverArrival,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["driver-active-ride"],
      });
    },
  });

  // ==============================
  // ARRIVED
  // ==============================

  const arrivedMutation = useMutation({
    mutationFn: markDriverArrived,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["driver-active-ride"],
      });
    },
  });

  // ==============================
  // START TRIP
  // ==============================

  const startMutation = useMutation({
    mutationFn: startTrip,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["driver-active-ride"],
      });
    },
  });

  // ==============================
  // COMPLETE TRIP
  // ==============================

  const completeMutation = useMutation({
    mutationFn: completeTrip,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["driver-active-ride"],
      });

      queryClient.invalidateQueries({
        queryKey: ["driver-profile"],
      });
    },
  });

  // ==============================
  // LOADING
  // ==============================

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 text-white">
        <h1 className="text-2xl font-bold">Loading Driver Dashboard...</h1>
      </div>
    );
  }

  // ==============================
  // PROFILE ERROR
  // ==============================

  if (profileError) {
    console.error("PROFILE ERROR:", profileErrorData);

    return (
      <div className="min-h-screen bg-gray-950 p-6 text-white">
        <h1 className="text-2xl font-bold text-red-400">
          Failed to load driver profile
        </h1>

        <pre className="mt-4 rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          {JSON.stringify(
            profileErrorData?.response?.data || profileErrorData,
            null,
            2,
          )}
        </pre>
      </div>
    );
  }

  // ==============================
  // NO DRIVER PROFILE
  // ==============================

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 text-white">
        <h1 className="text-2xl font-bold text-red-400">
          Driver profile not found
        </h1>

        <p className="mt-2 text-gray-300">
          Check the browser console for the API response.
        </p>

        <pre className="mt-4 rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          {JSON.stringify(profileResponse, null, 2)}
        </pre>
      </div>
    );
  }

  // ==============================
  // DASHBOARD
  // ==============================

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between rounded-xl bg-gray-900 p-6 shadow">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>

            <p className="mt-1 text-gray-400">
              Welcome{" "}
              {driverProfile.user?.name || driverProfile.name || "Driver"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-400">Status</p>

              <p
                className={
                  driverProfile.isOnline
                    ? "font-bold text-green-600"
                    : "font-bold text-gray-400"
                }
              >
                {driverProfile.isOnline ? "ONLINE" : "OFFLINE"}
              </p>
            </div>

            <button
              onClick={toggleOnlineStatus}
              disabled={statusMutation.isPending}
              className={`rounded-lg px-5 py-2 font-medium text-white ${
                driverProfile.isOnline
                  ? "bg-red-9500 hover:bg-red-600"
                  : "bg-green-9500 hover:bg-green-600"
              }`}
            >
              {statusMutation.isPending
                ? "Updating..."
                : driverProfile.isOnline
                  ? "Go Offline"
                  : "Go Online"}
            </button>
          </div>
        </div>

        {/* DRIVER INFO */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Verification"
            value={driverProfile.verificationStatus}
          />

          <InfoCard title="Rating" value={driverProfile.rating ?? 5} />

          <InfoCard title="Total Rides" value={driverProfile.totalRides ?? 0} />
        </div>

        {/* ACTIVE RIDE */}

        <div className="mb-6 rounded-xl bg-gray-900 p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Active Ride</h2>

          {activeRideLoading && (
            <p className="text-gray-400">Checking active ride...</p>
          )}

          {activeRideError && (
            <div className="rounded-lg bg-red-950 p-4 text-red-400">
              Failed to load active ride.
              <pre className="mt-2 text-xs">
                {JSON.stringify(
                  activeRideErrorData?.response?.data || activeRideErrorData,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}

          {!activeRideLoading && !activeRideError && !activeRide && (
            <p className="text-gray-400">No active ride.</p>
          )}

          {activeRide && (
            <ActiveRide
              ride={activeRide}
              arrivingMutation={arrivingMutation}
              arrivedMutation={arrivedMutation}
              startMutation={startMutation}
              completeMutation={completeMutation}
            />
          )}
        </div>

        {/* AVAILABLE RIDES */}

        {!activeRide && driverProfile.isOnline && (
          <div className="rounded-xl bg-gray-900 p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Available Rides</h2>

                <p className="text-sm text-gray-400">
                  Refreshing automatically every 5 seconds.
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-300">
                Online
              </span>
            </div>

            {availableLoading && (
              <p className="text-gray-400">Loading available rides...</p>
            )}

            {availableError && (
              <div className="rounded-lg bg-red-950 p-4 text-red-400">
                <p>Failed to load available rides.</p>

                <pre className="mt-2 text-xs">
                  {JSON.stringify(
                    availableErrorData?.response?.data || availableErrorData,
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}

            {!availableLoading &&
              !availableError &&
              availableRides.length === 0 && (
                <div className="rounded-lg border border-gray-700 border-dashed p-8 text-center">
                  <p className="font-medium">No rides available</p>

                  <p className="mt-1 text-sm text-gray-400">
                    New passenger requests will appear here.
                  </p>
                </div>
              )}

            <div className="space-y-4">
              {availableRides.map((ride) => (
                <div key={ride._id} className="rounded-xl border p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">New Ride Request</h3>

                      <p className="text-sm text-gray-400">
                        Passenger: {ride.passenger?.name || "Passenger"}
                      </p>
                    </div>

                    <p className="text-xl font-bold">₹{ride.estimatedFare}</p>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">
                        Pickup
                      </p>

                      <p>{ride.pickup?.address}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">
                        Destination
                      </p>

                      <p>{ride.destination?.address}</p>
                    </div>
                  </div>

                  <div className="mb-4 flex gap-6 text-sm">
                    <span>Distance: {ride.distance} km</span>

                    <span>Duration: {ride.estimatedDuration} min</span>
                  </div>

                  <button
                    onClick={() => acceptMutation.mutate(ride._id)}
                    disabled={acceptMutation.isPending}
                    className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? "Accepting..." : "Accept Ride"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OFFLINE */}

        {!driverProfile.isOnline && !activeRide && (
          <div className="rounded-xl bg-gray-900 p-8 text-center shadow">
            <h2 className="text-xl font-bold">You are offline</h2>

            <p className="mt-2 text-gray-400">
              Go online to receive passenger ride requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ACTIVE RIDE COMPONENT
// ============================================

function ActiveRide({
  ride,
  arrivingMutation,
  arrivedMutation,
  startMutation,
  completeMutation,
}) {
  return (
    <div>
      {/* STATUS */}

      <div className="mb-5">
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
          {formatStatus(ride.status)}
        </span>
      </div>

      {/* PASSENGER */}

      <div className="mb-5 rounded-lg bg-gray-800 p-4">
        <h3 className="font-bold">Passenger</h3>

        <p className="mt-1">{ride.passenger?.name || "Passenger"}</p>

        {ride.passenger?.phone && (
          <p className="text-sm text-gray-400">{ride.passenger.phone}</p>
        )}
      </div>

      {/* LOCATIONS */}

      <div className="mb-5 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase text-gray-400">Pickup</p>

          <p>{ride.pickup?.address}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-gray-400">
            Destination
          </p>

          <p>{ride.destination?.address}</p>
        </div>
      </div>

      {/* RIDE INFO */}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <InfoCard title="Distance" value={`${ride.distance ?? "-"} km`} />

        <InfoCard
          title="Duration"
          value={`${ride.estimatedDuration ?? "-"} min`}
        />

        <InfoCard
          title="Fare"
          value={`₹${ride.finalFare ?? ride.estimatedFare ?? "-"}`}
        />
      </div>

      {/* ACTIONS */}

      {ride.status === "DRIVER_ASSIGNED" && (
        <ActionButton
          loading={arrivingMutation.isPending}
          onClick={() => arrivingMutation.mutate(ride._id)}
        >
          Start Arrival
        </ActionButton>
      )}

      {ride.status === "DRIVER_ARRIVING" && (
        <ActionButton
          loading={arrivedMutation.isPending}
          onClick={() => arrivedMutation.mutate(ride._id)}
        >
          I've Arrived
        </ActionButton>
      )}

      {ride.status === "DRIVER_ARRIVED" && (
        <ActionButton
          loading={startMutation.isPending}
          onClick={() => startMutation.mutate(ride._id)}
        >
          Start Trip
        </ActionButton>
      )}

      {ride.status === "IN_PROGRESS" && (
        <ActionButton
          loading={completeMutation.isPending}
          onClick={() => completeMutation.mutate(ride._id)}
        >
          Complete Trip
        </ActionButton>
      )}

      {ride.status === "PAYMENT_PENDING" && (
        <div className="rounded-lg bg-yellow-950 p-4 text-center">
          <p className="font-semibold text-yellow-300">
            Waiting for passenger payment
          </p>
        </div>
      )}

      {ride.status === "PAID" && (
        <div className="rounded-lg bg-green-950 p-4 text-center">
          <p className="font-semibold text-green-300">Payment received</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// INFO CARD
// ============================================

function InfoCard({ title, value }) {
  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <p className="text-xs uppercase text-gray-400">{title}</p>

      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

// ============================================
// ACTION BUTTON
// ============================================

function ActionButton({ children, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? "Processing..." : children}
    </button>
  );
}

// ============================================
// FORMAT STATUS
// ============================================

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default Dashboard;
