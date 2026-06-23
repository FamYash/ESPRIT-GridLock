import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number][];
  gradient?: Record<number, string>;
  radius?: number;
  blur?: number;
  minOpacity?: number;
}

const DEFAULT_GRADIENT: Record<number, string> = {
  0.3: "#3b82f6",
  0.5: "#22c55e",
  0.7: "#eab308",
  0.9: "#f97316",
  1.0: "#ef4444",
};

const PREDICTED_GRADIENT: Record<number, string> = {
  0.2: "#1e1b4b",
  0.4: "#7c3aed",
  0.6: "#a855f7",
  0.8: "#d946ef",
  1.0: "#fdf4ff",
};

const HeatmapLayer = ({
  points,
  gradient,
  radius = 30,
  blur = 22,
  minOpacity = 0.45,
}: HeatmapLayerProps) => {
  const map = useMap();
  const g = gradient ?? DEFAULT_GRADIENT;

  useEffect(() => {
    if (!map) return;
    if (!points.length) return;

    let heatLayer: any;

    const createLayer = () => {
      heatLayer = (L as any).heatLayer(points, {
        radius,
        blur,
        maxZoom: 18,
        minOpacity,
        gradient: g,
      });

      heatLayer.addTo(map);
    };

    map.whenReady(() => {
      setTimeout(createLayer, 300);
    });

    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, g, radius, blur, minOpacity]);

  return null;
};

export { PREDICTED_GRADIENT, DEFAULT_GRADIENT };
export default HeatmapLayer;