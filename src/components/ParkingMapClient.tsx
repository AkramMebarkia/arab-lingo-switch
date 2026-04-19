import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CAMPUS_CENTER, type ParkingLot } from "@/lib/mock-data";

interface ParkingMapProps {
  lots: ParkingLot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  routeTo?: ParkingLot | null;
  theme: "light" | "dark";
}

const STATUS_COLOR: Record<ParkingLot["status"], string> = {
  available: "#22c55e",
  limited: "#f59e0b",
  occupied: "#ef4444",
};

// Light tiles: CARTO Voyager. Dark tiles: CARTO Dark Matter. Both free, no key.
const TILE_LIGHT =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

function buildIcon(lot: ParkingLot, selected: boolean, theme: "light" | "dark") {
  const size = selected ? 44 : 36;
  const ring = theme === "dark" ? "rgba(20,22,30,0.9)" : "rgba(255,255,255,0.95)";
  const color = STATUS_COLOR[lot.status];
  const halo = selected ? `0 0 0 6px ${color}33,` : "";
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:9999px;background:${color};
      color:#fff;font-weight:700;font-size:11px;display:grid;place-items:center;
      border:3px solid ${ring};
      box-shadow:${halo} 0 6px 20px rgba(0,0,0,0.35);
      transition:all 220ms cubic-bezier(0.34,1.56,0.64,1);
      font-family:ui-sans-serif,system-ui,sans-serif;
    ">${lot.available}</div>
  `;
  return L.divIcon({
    html,
    className: "kfupm-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ lot }: { lot: ParkingLot | null }) {
  const map = useMap();
  useEffect(() => {
    if (!lot) return;
    map.flyTo([lot.coordinates[1], lot.coordinates[0]], 17, { duration: 0.8 });
  }, [lot, map]);
  return null;
}

export function ParkingMap({
  lots,
  selectedId,
  onSelect,
  routeTo,
  theme,
}: ParkingMapProps) {
  const center = useMemo<[number, number]>(
    () => [CAMPUS_CENTER[1], CAMPUS_CENTER[0]],
    [],
  );

  const selectedLot = lots.find((l) => l.id === selectedId) ?? null;
  const flyTarget = routeTo ?? selectedLot;

  const routePath: [number, number][] | null = routeTo
    ? [
        [CAMPUS_CENTER[1], CAMPUS_CENTER[0]],
        [routeTo.coordinates[1], routeTo.coordinates[0]],
      ]
    : null;

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: theme === "dark" ? "#1a1d24" : "#f3f4f6" }}
      >
        <TileLayer
          key={theme}
          url={theme === "dark" ? TILE_DARK : TILE_LIGHT}
          attribution={TILE_ATTR}
        />

        {routePath && (
          <>
            <Polyline
              positions={routePath}
              pathOptions={{ color: "#3b82f6", weight: 12, opacity: 0.25 }}
            />
            <Polyline
              positions={routePath}
              pathOptions={{ color: "#60a5fa", weight: 4, opacity: 0.95 }}
            />
          </>
        )}

        {lots.map((lot) => (
          <Marker
            key={lot.id}
            position={[lot.coordinates[1], lot.coordinates[0]]}
            icon={buildIcon(lot, selectedId === lot.id, theme)}
            eventHandlers={{ click: () => onSelect(lot.id) }}
          />
        ))}

        <FlyTo lot={flyTarget} />
      </MapContainer>
    </div>
  );
}
