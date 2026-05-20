import { useEffect, useState } from "react";
import { Polyline, Popup, type PolylineProps } from "react-leaflet";
import { fetchDrivingRoute, type LatLngTuple } from "../services/routingService";

type Props = {
  from: LatLngTuple;
  to: LatLngTuple;
  pathOptions?: PolylineProps["pathOptions"];
  popupContent?: React.ReactNode;
};

/** Polyline theo đường lái xe (OSRM), fallback đường thẳng khi API lỗi. */
export function RoadRoutePolyline({ from, to, pathOptions, popupContent }: Props) {
  const [positions, setPositions] = useState<LatLngTuple[]>([from, to]);

  useEffect(() => {
    let active = true;
    setPositions([from, to]);

    fetchDrivingRoute(from[0], from[1], to[0], to[1]).then((result) => {
      if (active && result && result.positions.length >= 2) {
        setPositions(result.positions);
      }
    });

    return () => {
      active = false;
    };
  }, [from[0], from[1], to[0], to[1]]);

  if (positions.length < 2) return null;

  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      {popupContent ? <Popup>{popupContent}</Popup> : null}
    </Polyline>
  );
}
