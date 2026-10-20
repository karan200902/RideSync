import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../../lib/googleMaps.js";

function RideMap({ pickup, destination, onRouteCalculated }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize Google Map
  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError("");

        const { Map } = await loadGoogleMaps();

        if (!mounted || !mapContainerRef.current) {
          return;
        }

        const map = new Map(mapContainerRef.current, {
          center: {
            lat: 20.5937,
            lng: 78.9629,
          },
          zoom: 5,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (err) {
        console.error("Map initialization error:", err);

        if (mounted) {
          setError("Unable to load Google Maps.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate route when map and locations are ready
  useEffect(() => {
    if (!mapReady) {
      return;
    }

    if (!pickup || !destination) {
      return;
    }

    calculateRoute();
  }, [pickup, destination, mapReady]);

  // Clear previous route and markers
  const clearMapObjects = () => {
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });

    polylinesRef.current = [];
    markersRef.current = [];
  };

  // Calculate route
  const calculateRoute = async () => {
    if (!mapRef.current) {
      return;
    }

    try {
      setRouteLoading(true);
      setError("");

      clearMapObjects();

      const { Route } = await loadGoogleMaps();

      const request = {
        origin: {
          lat: Number(pickup.latitude),
          lng: Number(pickup.longitude),
        },
        destination: {
          lat: Number(destination.latitude),
          lng: Number(destination.longitude),
        },
        travelMode: "DRIVING",
        fields: [
          "path",
          "distanceMeters",
          "durationMillis",
          "viewport",
        ],
      };

      console.log("Route request:", request);

      const { routes } = await Route.computeRoutes(request);

      console.log("Routes response:", routes);

      if (!routes || routes.length === 0) {
        throw new Error(
          "No route was found between these locations.",
        );
      }

      const route = routes[0];

      console.log("Route:", route);
      console.log("Route path:", route.path);
      console.log("Route distance:", route.distanceMeters);
      console.log("Route duration:", route.durationMillis);
      console.log("Route viewport:", route.viewport);

      if (!route.path || route.path.length === 0) {
        throw new Error(
          "Google returned a route without a path.",
        );
      }

      // Create route polyline
      const polylines = route.createPolylines();

      console.log("Created polylines:", polylines);

      if (!polylines || polylines.length === 0) {
        throw new Error(
          "Unable to create route polyline.",
        );
      }

      polylines.forEach((polyline) => {
        polyline.setMap(mapRef.current);
      });

      polylinesRef.current = polylines;

      // Create pickup and destination markers
      try {
        const markers =
          await route.createWaypointAdvancedMarkers({
            map: mapRef.current,
          });

        markersRef.current = markers || [];

        console.log("Route markers:", markers);
      } catch (markerError) {
        console.warn(
          "Unable to create route markers:",
          markerError,
        );
      }

      // Calculate distance in kilometers
      const distanceKm = route.distanceMeters / 1000;

      // Calculate duration in minutes
      const durationMinutes =
        route.durationMillis / 60000;

      console.log(
        "Distance:",
        distanceKm,
        "km",
      );

      console.log(
        "Duration:",
        durationMinutes,
        "minutes",
      );

      // Automatically fit the complete route inside the map
      if (route.viewport) {
        mapRef.current.fitBounds(
          route.viewport,
          80,
        );
      }

      // Send route information to parent component
      onRouteCalculated({
        distanceKm,
        durationMinutes,
      });
    } catch (err) {
      console.error(
        "Route calculation error:",
        err,
      );

      setError(
        err?.message ||
          "Unable to calculate the route. Please try different locations.",
      );

      onRouteCalculated(null);
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-gray-800">
        <div
          ref={mapContainerRef}
          className="h-[400px] w-full"
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <p className="text-sm text-gray-400">
              Loading map...
            </p>
          </div>
        )}

        {routeLoading && !loading && (
          <div className="absolute left-4 top-4 rounded-lg bg-gray-900/90 px-4 py-2">
            <p className="text-sm text-gray-300">
              Calculating route...
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default RideMap;