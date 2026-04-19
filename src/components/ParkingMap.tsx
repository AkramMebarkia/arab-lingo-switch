import { lazy, Suspense, useEffect, useState } from "react";
import type { ParkingLot } from "@/lib/mock-data";

export type LotMarkerState = "eligible" | "ineligible" | "prohibited";

interface ParkingMapProps {
  lots: ParkingLot[];
  selectedId: string | null;
  onSelect: (id: string, state: LotMarkerState) => void;
  routeTo?: ParkingLot | null;
  theme: "light" | "dark";
  ineligible?: ParkingLot[];
  prohibited?: ParkingLot[];
}

const LazyMap = lazy(() =>
  import("./ParkingMapClient").then((m) => ({ default: m.ParkingMap })),
);

const Fallback = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="dot-pulse h-3 w-3 rounded-full bg-primary" />
  </div>
);

export function ParkingMap(props: ParkingMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Fallback />;
  return (
    <Suspense fallback={<Fallback />}>
      <LazyMap {...props} />
    </Suspense>
  );
}
