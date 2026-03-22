import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Search, CheckCircle2, Circle, MapPin, Share2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import { api } from "@/lib/api";
import potholeSample from "@/assets/pothole-sample.jpg";
import MapLibreCanvas from "@/components/maps/MapLibreCanvas";
import { useAuth } from "@/context/AuthContext";

const timelineOrder = ["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const slaHours = 48;

function formatRemaining(durationMs: number) {
  if (durationMs <= 0) return "00h 00m";
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}h ${minutes}m`;
}

function formatRelativeTime(input?: string) {
  if (!input) return "Just now";
  const createdAt = new Date(input);
  const minutes = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const TrackingPage = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCitizen = user?.role === "citizen";
  const [searchId, setSearchId] = useState(complaintId || "");
  const activeComplaintId = complaintId || searchId;

  const { data: complaint } = useQuery({
    queryKey: ["complaint", activeComplaintId],
    queryFn: () => api.getComplaintById(activeComplaintId),
    enabled: Boolean(activeComplaintId),
    refetchInterval: 15000,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["complaint-timeline", activeComplaintId],
    queryFn: () => api.getComplaintTimeline(activeComplaintId),
    enabled: Boolean(activeComplaintId),
    refetchInterval: 15000,
  });

  const timelineSteps = useMemo(() => {
    const currentState = complaint?.status || "ASSIGNED";

    return timelineOrder.map((state) => {
      const event = timeline.find((item) => item.state === state);
      const currentIndex = timelineOrder.indexOf(currentState);
      const stepIndex = timelineOrder.indexOf(state);

      return {
        label: state.replace("_", " "),
        detail: event ? new Date(event.at).toLocaleString() : "Awaiting update",
        done: stepIndex < currentIndex,
        active: stepIndex === currentIndex,
      };
    });
  }, [complaint?.status, timeline]);

  const slaInfo = useMemo(() => {
    if (!complaint?.createdAt) {
      return { remainingLabel: "N/A", escalated: false };
    }

    const createdMs = new Date(complaint.createdAt).getTime();
    if (Number.isNaN(createdMs)) {
      return { remainingLabel: "N/A", escalated: false };
    }

    const deadlineMs = createdMs + slaHours * 60 * 60 * 1000;
    const remainingMs = deadlineMs - Date.now();
    const resolved = complaint.status === "RESOLVED";

    return {
      remainingLabel: resolved ? "Resolved" : formatRemaining(remainingMs),
      escalated: !resolved && remainingMs < 0,
    };
  }, [complaint?.createdAt, complaint?.status]);

  const severityClass = complaint?.severity ? `severity-${complaint.severity.toLowerCase()}` : "severity-medium";
  const mapCenter = complaint?.coordinates || [75.9064, 17.6599];
  const markerColor = complaint?.severity === "HIGH" ? "#dc2626" : complaint?.severity === "MEDIUM" ? "#f59e0b" : "#16a34a";

  const handleSearch = () => {
    if (!searchId.trim()) {
      return;
    }

    navigate(`/track/${searchId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        {!isCitizen ? (
        <aside className="hidden lg:flex w-56 border-r border-border bg-card flex-col min-h-[calc(100vh-64px)]">
          <div className="p-5">
            <h2 className="font-bold text-foreground">RoadSense Admin</h2>
            <p className="text-xs text-muted-foreground">City Council Portal</p>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {[
              { label: "Overview", icon: "📊", to: "/admin" },
              { label: "Complaints", icon: "⚠️", to: "/admin/complaints" },
              { label: "Map", icon: "🗺️", to: "/admin/map", active: true },
              { label: "Tasks", icon: "📋", to: "/admin/assignments" },
              { label: "Log", icon: "🕐", to: "/admin/activity-log" },
            ].map((item) => (
              <Link
                to={item.to}
                key={item.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 space-y-1">
            <Button className="w-full" size="sm" onClick={() => navigate("/report")}>New Report</Button>
            <button onClick={() => navigate("/admin/analytics")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">⚙️ Settings</button>
            <button onClick={() => navigate("/admin/activity-log")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">❓ Support</button>
          </div>
        </aside>
        ) : null}

        {/* Map Area */}
        <div className="flex-1 relative min-h-[calc(100vh-64px)]">
          <div className="absolute inset-0 bg-secondary flex items-center justify-center">
            <MapLibreCanvas
              center={mapCenter}
              zoom={12}
              markers={[
                {
                  coordinates: mapCenter,
                  color: markerColor,
                  label: complaint ? `${complaint.id} - ${complaint.location}` : "Selected complaint",
                },
              ]}
            />
          </div>

          {/* Layer control */}
          {!isCitizen ? (
          <div className="absolute top-4 left-4 bg-card rounded-xl shadow-md border border-border p-4 z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground mb-2">Active Layers</p>
            <div className="space-y-1.5">
              {[
                { label: "Potholes", color: "bg-destructive" },
                { label: "Lighting", color: "bg-primary" },
                { label: "Drainage", color: "bg-teal" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`h-3 w-3 rounded-sm ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          ) : null}

          {/* Search */}
          <div className={`absolute top-4 right-4 ${!isCitizen ? "lg:right-[340px]" : ""} z-10`}>
            <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-md border border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search report ID..."
                className="bg-transparent text-sm outline-none w-36 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {isCitizen && complaint ? (
            <div className="absolute left-4 right-4 bottom-4 bg-card/95 border border-border rounded-xl p-4 z-10 backdrop-blur-sm">
              <div className="grid md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <img src={complaint.imageUrl || potholeSample} alt="Uploaded complaint" className="w-full h-24 object-cover rounded-lg border border-border" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal">Map View</p>
                  <p className="text-sm font-semibold text-foreground">{complaint.id} • {complaint.type}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {complaint.location}</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal">Status: {complaint.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {`Lat: ${complaint.coordinates?.[1]?.toFixed(6) ?? "--"}, Lng: ${complaint.coordinates?.[0]?.toFixed(6) ?? "--"}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Updated {formatRelativeTime(complaint.createdAt)}</p>
                  <p className={`text-xs font-semibold ${slaInfo.escalated ? "text-destructive" : "text-teal"}`}>
                    SLA {slaHours}h: {slaInfo.escalated ? "Escalated" : slaInfo.remainingLabel}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Tracking Progress</p>
                <div className="space-y-2">
                  {timelineSteps.map((step) => (
                    <div key={step.label} className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${step.active ? "text-teal" : step.done ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                      <span className="text-muted-foreground">{step.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Detail Panel */}
        {!isCitizen ? (
        <aside className="hidden lg:block w-80 border-l border-border bg-card overflow-y-auto min-h-[calc(100vh-64px)]">
          <div className="relative">
            <img src={complaint?.imageUrl || potholeSample} alt="Pothole" className="w-full h-48 object-cover" />
            <span className={`absolute top-3 left-3 ${severityClass} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md`}>
              {complaint?.severity || "MEDIUM"} Severity
            </span>
          </div>

          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-foreground">{complaint?.id || "Loading..."}</h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">{formatRelativeTime(complaint?.createdAt)}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {complaint
                ? complaint.description && complaint.description.trim().length > 0
                  ? complaint.description
                  : `${complaint.type} reported at ${complaint.location}.`
                : "Loading complaint details..."}
            </p>

            <p className="text-xs text-muted-foreground mb-5">
              {`Lat: ${complaint?.coordinates?.[1]?.toFixed(6) ?? "--"}, Lng: ${complaint?.coordinates?.[0]?.toFixed(6) ?? "--"}`}
            </p>

            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Tracking Status</h4>

            <div className="space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-teal shrink-0" />
                    ) : step.active ? (
                      <Circle className="h-5 w-5 text-teal shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                    )}
                    {i < timelineSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${step.done ? "bg-teal" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-semibold ${step.done || step.active ? "text-foreground" : "text-muted-foreground/50"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                    {step.active && (
                      <div className="flex items-center gap-2 mt-2 bg-teal/10 text-teal rounded-lg px-3 py-2 text-xs font-medium">
                        <Truck className="h-3.5 w-3.5" />
                        ETA: 4 Hours
                      </div>
                    )}
                    {step.active && slaInfo.escalated && (
                      <div className="mt-2 bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs font-medium">
                        Escalated: complaint exceeded {slaHours}h SLA
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <Button variant="outline" className="w-full gap-2">
                <Share2 className="h-4 w-4" /> Share Update
              </Button>
            </div>
          </div>
        </aside>
        ) : null}
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default TrackingPage;
