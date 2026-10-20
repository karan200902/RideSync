import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import LocationSearch from "../../components/passenger/LocationSearch.jsx";
import RideMap from "../../components/passenger/RideMap.jsx";
import { createRide } from "../../api/rideApi.js";

function RequestRide() {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [vehicleType, setVehicleType] = useState("car");
  const [route, setRoute] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // PICKUP LOCATION
  // --------------------------------------------------
  const handlePickupSelected = useCallback((place) => {
    setPickup(place);
    setRoute(null);
    setError("");
  }, []);

  // --------------------------------------------------
  // DESTINATION LOCATION
  // --------------------------------------------------
  const handleDestinationSelected = useCallback((place) => {
    setDestination(place);
    setRoute(null);
    setError("");
  }, []);

  // --------------------------------------------------
  // ROUTE CALCULATED
  // --------------------------------------------------
  const handleRouteCalculated = useCallback((routeData) => {
    setRoute(routeData);
  }, []);

  // --------------------------------------------------
  // SUBMIT RIDE REQUEST
  // --------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // Validate pickup
    if (!pickup) {
      setError("Please select a pickup location.");
      return;
    }

    // Validate destination
    if (!destination) {
      setError("Please select a destination.");
      return;
    }

    // Validate route
    if (!route) {
      setError("Please wait for the route to be calculated.");
      return;
    }

    try {
      setSubmitting(true);

      // Data sent to backend
      const rideData = {
        vehicleType,

        pickup: {
          address: pickup.address,
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },

        destination: {
          address: destination.address,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      };

      console.log("Creating ride:", rideData);

      // Call backend
      const response = await createRide(rideData);

      console.log("Ride created:", response);

      // Get created ride
      const ride = response?.data?.ride;

      if (!ride?._id) {
        throw new Error("Ride was created but no ride ID was returned.");
      }

      // Navigate to ride details
      navigate(`/passenger/rides/${ride._id}`);
    } catch (err) {
      console.error("Create ride error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to create ride. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Request a Ride</h1>

          <p className="mt-2 text-gray-400">
            Choose your pickup and destination.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LOCATION SEARCH */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="space-y-5">
              <LocationSearch
                label="Pickup Location"
                placeholder="Search pickup location..."
                value={pickup}
                onPlaceSelected={handlePickupSelected}
              />

              <LocationSearch
                label="Destination"
                placeholder="Search destination..."
                value={destination}
                onPlaceSelected={handleDestinationSelected}
              />
            </div>
          </div>

          {/* MAP */}
          {pickup && destination && (
            <RideMap
              pickup={pickup}
              destination={destination}
              onRouteCalculated={handleRouteCalculated}
            />
          )}

          {/* ROUTE INFORMATION */}
          {route && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-sm text-gray-500">Distance</p>

                <p className="mt-1 text-xl font-semibold text-white">
                  {route.distanceKm.toFixed(1)} km
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-sm text-gray-500">Estimated Time</p>

                <p className="mt-1 text-xl font-semibold text-white">
                  {Math.ceil(route.durationMinutes)} min
                </p>
              </div>
            </div>
          )}

          {/* VEHICLE SELECTION */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <label className="block text-sm font-medium text-gray-300">
              Select Vehicle
            </label>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {["bike", "auto", "car"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={`rounded-xl border px-4 py-4 text-sm font-medium capitalize transition ${
                    vehicleType === type
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-gray-700 bg-gray-950 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* ROUTE SUMMARY */}
          {pickup && destination && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <p className="mb-4 text-sm font-medium text-gray-300">
                Route Summary
              </p>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-green-400">Pickup</p>

                  <p className="mt-1 text-gray-400">{pickup.address}</p>
                </div>

                <div>
                  <p className="text-red-400">Destination</p>

                  <p className="mt-1 text-gray-400">{destination.address}</p>
                </div>

                {route && (
                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distance</span>

                      <span className="text-white">
                        {route.distanceKm.toFixed(1)} km
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between">
                      <span className="text-gray-500">Estimated time</span>

                      <span className="text-white">
                        {Math.ceil(route.durationMinutes)} min
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={!pickup || !destination || !route || submitting}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating Ride..." : "Request Ride"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RequestRide;
