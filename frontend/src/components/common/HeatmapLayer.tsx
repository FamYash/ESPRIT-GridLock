import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number][];
}

const HeatmapLayer = ({ points }: HeatmapLayerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!points.length) return;

    let heatLayer: any;

    const createLayer = () => {
      heatLayer = (L as any).heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.4,
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
  }, [map, points]);

  return null;
};

export default HeatmapLayer;