const reverseGeocodeCache = new Map<string, string>();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

function getCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function parseLatLngLabel(locationLabel?: string): { lat: number; lng: number } | null {
  if (!locationLabel) return null;

  const match = locationLabel.match(/Lat\s*(-?\d+(?:\.\d+)?),\s*Lng\s*(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const cacheKey = getCacheKey(lat, lng);
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey) || null;
  }

  try {
    const url = `${API_BASE_URL}/ai/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: { locationName?: string } };
    const locationName = payload.data?.locationName || null;

    if (locationName) {
      reverseGeocodeCache.set(cacheKey, locationName);
    }

    return locationName;
  } catch {
    return null;
  }
}
