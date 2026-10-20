import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../../lib/googleMaps.js";

function LocationSearch({ label, placeholder, value, onPlaceSelected }) {
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const initializeAutocomplete = async () => {
      try {
        setLoading(true);
        setError("");

        const { PlaceAutocompleteElement } = await loadGoogleMaps();

        if (!mounted || !containerRef.current) {
          return;
        }

        const autocomplete = new PlaceAutocompleteElement();

        autocomplete.placeholder = placeholder;

        autocomplete.addEventListener("gmp-select", async (event) => {
          try {
            const placePrediction = event.placePrediction;

            if (!placePrediction) {
              return;
            }

            const place = placePrediction.toPlace();

            await place.fetchFields({
              fields: ["displayName", "formattedAddress", "location"],
            });

            if (!place.location) {
              setError("This location does not have valid coordinates.");
              return;
            }

            const selectedPlace = {
              name: place.displayName || "",
              address: place.formattedAddress || "",
              latitude: place.location.lat(),
              longitude: place.location.lng(),
            };

            onPlaceSelected(selectedPlace);
          } catch (err) {
            console.error("Place selection error:", err);
            setError("Unable to get this location.");
          }
        });

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(autocomplete);

        autocompleteRef.current = autocomplete;
      } catch (err) {
        console.error("Google Maps initialization error:", err);
        setError("Unable to load Google Maps.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAutocomplete();

    return () => {
      mounted = false;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      autocompleteRef.current = null;
    };
  }, [placeholder, onPlaceSelected]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>

      <div ref={containerRef} className="google-location-input" />

      {loading && (
        <p className="text-xs text-gray-500">Loading location search...</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {value?.address && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
          <p className="text-sm text-green-400">✓ {value.address}</p>
        </div>
      )}
    </div>
  );
}

export default LocationSearch;
