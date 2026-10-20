function CurrentRideCard({ ride }) {
  if (!ride) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Current Ride</h2>

            <p className="mt-1 text-sm text-gray-400">
              You don't have an active ride right now.
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
            🚗
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-900 bg-gray-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-400">Active Ride</p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            {ride.status}
          </h2>
        </div>

        <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-400">
          In Progress
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <p className="text-xs text-gray-500">Pickup</p>
          <p className="text-sm text-gray-300">{ride.pickup}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Destination</p>
          <p className="text-sm text-gray-300">{ride.destination}</p>
        </div>
      </div>

      <button className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
        View Ride
      </button>
    </div>
  );
}

export default CurrentRideCard;
