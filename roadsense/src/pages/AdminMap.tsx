import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, X } from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import MapLibreCanvas from "@/components/maps/MapLibreCanvas";
import { api } from "@/lib/api";

const AdminMap = () => {
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"complaints" | "clusters">("complaints");

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-map-complaints"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  const { data: clusterData } = useQuery({
    queryKey: ["admin-map-clusters"],
    queryFn: api.getAdminMapData,
    refetchInterval: 15000,
  });

  const plottedComplaints = useMemo(
    () => complaints.filter((complaint) => Array.isArray(complaint.coordinates) && complaint.coordinates.length === 2),
    [complaints]
  );

  const markers = plottedComplaints.map((complaint) => ({
    coordinates: complaint.coordinates as [number, number],
    color: complaint.severity === "HIGH" ? "#dc2626" : complaint.severity === "MEDIUM" ? "#f59e0b" : "#16a34a",
    label: `${complaint.id} • ${complaint.type}`,
    onClick: () => setSelectedComplaintId(complaint.id),
  }));

  const baseCoordinates: Array<[number, number]> = [
    [75.901, 17.662],
    [75.917, 17.671],
    [75.889, 17.649],
    [75.923, 17.654],
    [75.895, 17.675],
  ];

  const clusterMarkers = (clusterData?.clusters || []).map((cluster, index) => ({
    coordinates: baseCoordinates[index % baseCoordinates.length],
    color: cluster.count > 10 ? "#dc2626" : cluster.count > 5 ? "#f59e0b" : "#16a34a",
    label: `${cluster.area} • ${cluster.count} complaints`,
  }));

  const selectedComplaint = selectedComplaintId
    ? plottedComplaints.find((complaint) => complaint.id === selectedComplaintId) || null
    : null;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="map" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">Admin Map View</h1>
          <p className="text-sm text-muted-foreground mb-6">All complaints plotted live. Click a yellow pin to open details.</p>

          <div className="mb-4 inline-flex rounded-lg bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMapMode("complaints")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mapMode === "complaints" ? "bg-card text-foreground" : "text-muted-foreground"
              }`}
            >
              All Complaints
            </button>
            <button
              type="button"
              onClick={() => setMapMode("clusters")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mapMode === "clusters" ? "bg-card text-foreground" : "text-muted-foreground"
              }`}
            >
              Clustered Hotspots
            </button>
          </div>

          <div className="surface-card h-[560px] overflow-hidden relative">
            <MapLibreCanvas
              center={[75.9064, 17.6599]}
              zoom={11}
              heatPoints={
                mapMode === "complaints"
                  ? plottedComplaints.map((complaint) => ({
                      coordinates: complaint.coordinates as [number, number],
                      weight: complaint.severity === "HIGH" ? 6 : complaint.severity === "MEDIUM" ? 3 : 1,
                    }))
                  : (clusterData?.clusters || []).map((cluster, index) => ({
                      coordinates: baseCoordinates[index % baseCoordinates.length],
                      weight: Math.max(1, cluster.count),
                    }))
              }
              markers={mapMode === "complaints" ? markers : clusterMarkers}
            />

            {mapMode === "complaints" && selectedComplaint && (
              <section className="absolute right-3 top-3 bottom-3 w-[min(24rem,calc(100%-1.5rem))] bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl z-20">
                <div className="p-4 border-b border-border flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Complaint Detail</p>
                    <h2 className="text-base font-bold text-foreground mt-1">{selectedComplaint.id}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaintId(null)}
                    className="h-8 w-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex items-center justify-center"
                    aria-label="Close details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-69px)]">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-semibold text-foreground">{selectedComplaint.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold text-foreground">{selectedComplaint.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Severity</p>
                    <p className="text-sm font-semibold text-foreground">{selectedComplaint.severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm text-foreground flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{selectedComplaint.location}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground">{selectedComplaint.description || "No description provided."}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reported On</p>
                    <p className="text-sm text-foreground">
                      {selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  {selectedComplaint.imageUrl ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Attached Image</p>
                      <img
                        src={selectedComplaint.imageUrl}
                        alt={selectedComplaint.type}
                        className="w-full h-36 object-cover rounded-lg border border-border"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Showing {plottedComplaints.length} plotted complaints.
          </p>
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default AdminMap;
