import { useState } from "react";
import { Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import MapLibreCanvas from "@/components/maps/MapLibreCanvas";
import { api } from "@/lib/api";

const PublicMap = () => {
  const [highOnly, setHighOnly] = useState(false);
  const { data } = useQuery({
    queryKey: ["public-map"],
    queryFn: api.getPublicMapData,
  });

  const pins = (data?.pins || []).filter((pin) => (highOnly ? pin.severity === "HIGH" : true));
  const totalActive = (data?.heatmapSummary.high || 0) + (data?.heatmapSummary.medium || 0) + (data?.heatmapSummary.low || 0);

  const predictiveZones = Object.values(
    pins.reduce((acc, pin) => {
      const latBucket = pin.coordinates[1].toFixed(2);
      const lngBucket = pin.coordinates[0].toFixed(2);
      const key = `${latBucket},${lngBucket}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          score: 0,
          count: 0,
          high: 0,
        };
      }

      acc[key].count += 1;
      if (pin.severity === "HIGH") {
        acc[key].high += 1;
        acc[key].score += 3;
      } else if (pin.severity === "MEDIUM") {
        acc[key].score += 2;
      } else {
        acc[key].score += 1;
      }

      return acc;
    }, {} as Record<string, { key: string; score: number; count: number; high: number }>)
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 animate-fade-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-1">Public Visibility</p>
            <h1 className="text-3xl font-bold text-foreground">City Damage Map & Heatmap</h1>
          </div>
          <button
            onClick={() => setHighOnly((prev) => !prev)}
            className="mt-3 sm:mt-0 inline-flex items-center gap-2 bg-secondary text-muted-foreground px-3 py-2 rounded-lg text-sm"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 surface-card h-[520px] overflow-hidden animate-fade-up" style={{ animationDelay: "100ms" }}>
            <MapLibreCanvas
              center={[75.9064, 17.6599]}
              zoom={12}
              heatPoints={pins.map((pin) => ({
                coordinates: pin.coordinates,
                weight: pin.severity === "HIGH" ? 6 : pin.severity === "MEDIUM" ? 3 : 1,
              }))}
              markers={pins.map((pin) => ({
                coordinates: pin.coordinates,
                color: pin.severity === "HIGH" ? "#dc2626" : pin.severity === "MEDIUM" ? "#f59e0b" : "#16a34a",
                label: `${pin.severity} Severity - ${pin.id}`,
              }))}
            />
          </div>

          <div className="space-y-4 animate-fade-up" style={{ animationDelay: "180ms" }}>
            <div className="surface-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Total Active</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{totalActive || "..."}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">High-Risk Zone</p>
              <p className="text-lg font-semibold text-destructive">{predictiveZones[0]?.key || "N/A"}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Legend</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" /> High</p>
                <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Medium</p>
                <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-teal" /> Low</p>
              </div>
            </div>
            <div className="surface-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Predictive Risk Zones</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                {predictiveZones.length > 0 ? (
                  predictiveZones.map((zone) => (
                    <p key={zone.key}>
                      {zone.key} • Risk {zone.score} ({zone.count} reports, {zone.high} high)
                    </p>
                  ))
                ) : (
                  <p>No zone prediction available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default PublicMap;
