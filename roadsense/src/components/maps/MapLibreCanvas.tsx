import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapLibreCanvasProps {
  center?: [number, number];
  zoom?: number;
  heatPoints?: Array<{
    coordinates: [number, number];
    weight?: number;
  }>;
  markers?: Array<{
    coordinates: [number, number];
    color?: string;
    label?: string;
    onClick?: () => void;
  }>;
}

const MapLibreCanvas = ({
  center = [75.9064, 17.6599],
  zoom = 12,
  heatPoints = [],
  markers = [],
}: MapLibreCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center,
        zoom,
        attributionControl: {},
      });
    } catch (error) {
      setMapFailed(true);
      return;
    }

    setMapFailed(false);

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const addHeatLayers = () => {
      if (heatPoints.length === 0) {
        return;
      }

      const heatFeatures = heatPoints.map((point) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: point.coordinates,
        },
        properties: {
          weight: point.weight ?? 1,
        },
      }));

      map.addSource("roadsense-heat", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: heatFeatures,
        },
      });

      map.addLayer({
        id: "roadsense-heat-layer",
        type: "heatmap",
        source: "roadsense-heat",
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 6, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 15, 2.2],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(16, 185, 129, 0)",
            0.2,
            "rgba(16, 185, 129, 0.32)",
            0.45,
            "rgba(245, 158, 11, 0.45)",
            0.7,
            "rgba(245, 158, 11, 0.72)",
            1,
            "rgba(220, 38, 38, 0.85)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 18, 15, 40],
          "heatmap-opacity": 0.7,
        },
      });

      map.addLayer({
        id: "roadsense-heat-points",
        type: "circle",
        source: "roadsense-heat",
        minzoom: 13,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 3, 16, 7],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            1,
            "#10b981",
            3,
            "#f59e0b",
            6,
            "#dc2626",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
          "circle-opacity": 0.65,
        },
      });
    };

    if (map.isStyleLoaded()) {
      addHeatLayers();
    } else {
      map.once("load", addHeatLayers);
    }

    markers.forEach((marker) => {
      const popup = marker.label ? new maplibregl.Popup({ offset: 18 }).setText(marker.label) : undefined;

      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.setAttribute("aria-label", marker.label || "Map marker");
      markerElement.style.width = "24px";
      markerElement.style.height = "30px";
      markerElement.style.background = "transparent";
      markerElement.style.border = "none";
      markerElement.style.padding = "0";
      markerElement.style.cursor = "pointer";
      markerElement.style.display = "flex";
      markerElement.style.flexDirection = "column";
      markerElement.style.alignItems = "center";
      markerElement.style.justifyContent = "flex-start";

      const pinHead = document.createElement("span");
      pinHead.style.width = "18px";
      pinHead.style.height = "18px";
      pinHead.style.borderRadius = "9999px";
      pinHead.style.background = "#facc15";
      pinHead.style.border = "2px solid rgba(255,255,255,0.95)";
      pinHead.style.boxShadow = "0 6px 14px rgba(0,0,0,0.25)";

      const pinTip = document.createElement("span");
      pinTip.style.width = "9px";
      pinTip.style.height = "9px";
      pinTip.style.marginTop = "-2px";
      pinTip.style.background = "#facc15";
      pinTip.style.transform = "rotate(45deg)";
      pinTip.style.borderRight = "2px solid rgba(255,255,255,0.95)";
      pinTip.style.borderBottom = "2px solid rgba(255,255,255,0.95)";
      pinTip.style.boxSizing = "border-box";

      markerElement.append(pinHead, pinTip);

      if (marker.onClick) {
        markerElement.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          marker.onClick?.();
        });
      }

      const mapMarker = new maplibregl.Marker({
        element: markerElement,
      }).setLngLat(marker.coordinates);

      if (popup) {
        mapMarker.setPopup(popup);
      }

      mapMarker.addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [center, zoom, markers, heatPoints]);

  if (mapFailed) {
    return (
      <div className="h-full w-full bg-secondary flex items-center justify-center text-sm text-muted-foreground">
        Map unavailable. Check network or tile access.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
};

export default MapLibreCanvas;
