import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import { api, type Complaint } from "@/lib/api";

const severityColors: Record<string, string> = {
  HIGH: "severity-high",
  MEDIUM: "severity-medium",
  LOW: "severity-low",
};

const statusLabels: Record<string, string> = {
  SUBMITTED: "Submitted",
  VERIFIED: "Verified",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

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

const Feed = () => {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints-feed"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  const highSeverityCount = complaints.filter((item) => item.severity === "HIGH").length;
  const openComplaintsCount = complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "REJECTED").length;
  const latestComplaint = complaints[0];

  const feedItems = complaints.map((item: Complaint, index: number) => ({
    id: item.id,
    title: `${item.type} Report`,
    location: item.location,
    severity: item.severity,
    time: formatRelativeTime(item.createdAt),
    status: statusLabels[item.status] || item.status,
    desc:
      item.description && item.description.trim().length > 0
        ? item.description
        : `${item.type} reported and currently in ${item.status.toLowerCase()} stage.`,
    image: item.imageUrl || "",
    reporters: ["RS"],
    key: `${item.id}-${index}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 animate-fade-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-2">Live Community Insights</p>
            <h1 className="text-4xl font-bold text-foreground">
              Infrastructure <span className="text-muted-foreground/40">Intelligence</span>
            </h1>
          </div>
          <div className="surface-card px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active Reports</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{isLoading ? "..." : feedItems.length}</p>
          </div>
        </div>

        {/* Feed Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {feedItems.map((item, i) => (
            <div key={item.key} className="surface-card overflow-hidden group animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="relative overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-52 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No image uploaded</p>
                  </div>
                )}
                <span className={`absolute top-3 left-3 ${severityColors[item.severity]} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md`}>
                  {item.severity} Severity
                </span>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <span className="text-[10px] font-semibold text-teal uppercase">{item.time}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-3 w-3" /> {item.location}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-teal mb-2">{item.status}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <div className="flex -space-x-1.5">
                    {item.reporters.map((r) => (
                      <div key={r} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold border-2 border-card">{r}</div>
                    ))}
                  </div>
                  <Link to={`/track/${item.id}`} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 uppercase tracking-wider">
                    View Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && feedItems.length === 0 && (
            <div className="md:col-span-3 surface-card p-8 text-center text-muted-foreground">
              No complaints available.
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="grid md:grid-cols-5 gap-6 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="md:col-span-3 surface-card p-6 flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-full sm:w-48 h-48 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <div className="text-center">
                <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Live map from submitted reports</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-1">Live Heatmap</p>
              <h3 className="text-xl font-bold text-foreground mb-2">Geospatial Intelligence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Visualizing infrastructure health from real user reports. Red zones indicate high concentrations of unresolved high-severity complaints.
              </p>
              <Link to="/map">
                <Button variant="outline" size="sm" className="gap-2">
                  <Map className="h-4 w-4" /> Open Full Interactive Map
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:col-span-2 bg-primary text-primary-foreground rounded-xl p-6">
            <div className="h-10 w-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-teal text-lg">🤖</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Live AI Insight</h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-4">
              {`Open complaints: ${openComplaintsCount}. High severity reports: ${highSeverityCount}.`}
            </p>
            <div className="bg-primary-foreground/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-primary-foreground/50 mb-1">Recommendation</p>
              <p className="text-sm font-medium">
                {latestComplaint
                  ? `Prioritize ${latestComplaint.type} at ${latestComplaint.location}.`
                  : "No active recommendation until first complaint is submitted."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default Feed;
