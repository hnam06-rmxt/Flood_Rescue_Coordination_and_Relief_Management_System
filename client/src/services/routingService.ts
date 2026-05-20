/** [lat, lng] cho Leaflet */
export type LatLngTuple = [number, number];

export type DrivingRouteResult = {
  positions: LatLngTuple[];
  distanceKm: number;
  durationMin: number;
};

const OSRM_BASE =
  import.meta.env.VITE_OSRM_URL?.trim() || "https://router.project-osrm.org";

const routeCache = new Map<string, DrivingRouteResult>();

function cacheKey(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `${fromLat.toFixed(5)},${fromLng.toFixed(5)};${toLat.toFixed(5)},${toLng.toFixed(5)}`;
}

/**
 * Lấy lộ trình lái xe theo đường thực tế (OSRM).
 * Trả về null nếu API lỗi — caller dùng đường thẳng dự phòng.
 */
export async function fetchDrivingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DrivingRouteResult | null> {
  const key = cacheKey(fromLat, fromLng, toLat, toLng);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const url =
    `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}` +
    "?overview=full&geometries=geojson&steps=false";

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];
    const coords: [number, number][] = route?.geometry?.coordinates;
    if (!coords?.length) return null;

    const positions: LatLngTuple[] = coords.map(([lng, lat]) => [lat, lng] as LatLngTuple);
    const result: DrivingRouteResult = {
      positions,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
    };
    routeCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}
