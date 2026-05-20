import { useEffect, useState } from "react";
import { fetchDrivingRoute, type LatLngTuple } from "../services/routingService";

type State = {
  positions: LatLngTuple[];
  distanceKm: number | null;
  durationMin: number | null;
  loading: boolean;
  isRoadRoute: boolean;
};

export function useDrivingRoute(
  from: LatLngTuple | null,
  to: LatLngTuple | null
): State {
  const [state, setState] = useState<State>({
    positions: [],
    distanceKm: null,
    durationMin: null,
    loading: false,
    isRoadRoute: false,
  });

  useEffect(() => {
    if (!from || !to) {
      setState({
        positions: [],
        distanceKm: null,
        durationMin: null,
        loading: false,
        isRoadRoute: false,
      });
      return;
    }

    let active = true;
    const straight: LatLngTuple[] = [from, to];

    setState({
      positions: straight,
      distanceKm: null,
      durationMin: null,
      loading: true,
      isRoadRoute: false,
    });

    fetchDrivingRoute(from[0], from[1], to[0], to[1]).then((result) => {
      if (!active) return;
      if (result && result.positions.length >= 2) {
        setState({
          positions: result.positions,
          distanceKm: result.distanceKm,
          durationMin: result.durationMin,
          loading: false,
          isRoadRoute: true,
        });
      } else {
        setState({
          positions: straight,
          distanceKm: null,
          durationMin: null,
          loading: false,
          isRoadRoute: false,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  return state;
}
