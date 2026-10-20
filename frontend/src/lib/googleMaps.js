import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let mapsPromise = null;

export const loadGoogleMaps = async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      "Google Maps API key is missing. Check VITE_GOOGLE_MAPS_API_KEY.",
    );
  }

  if (!mapsPromise) {
    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: "weekly",
    });

    mapsPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("routes"),
    ]);
  }

  const [
    { Map },
    { PlaceAutocompleteElement },
    { Route },
  ] = await mapsPromise;

  return {
    Map,
    PlaceAutocompleteElement,
    Route,
  };
};