function RideCard({ ride }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">{ride.date}</p>

          <h3 className="mt-1 font-semibold text-white">{ride.vehicleType}</h3>
        </div>

        <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
          {ride.status}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />

          <div>
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm text-gray-300">{ride.pickup}</p>
          </div>
        </div>

        <div className="ml-1 h-4 border-l border-dashed border-gray-700" />

        <div className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />

          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm text-gray-300">{ride.destination}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">
        <span className="text-sm text-gray-400">Fare</span>

        <span className="font-semibold text-white">₹{ride.fare}</span>
      </div>
    </div>
  );
}

export default RideCard;
