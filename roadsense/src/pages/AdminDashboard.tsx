import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Users, MapPin, Filter, Download, Eye, ChevronRight, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { api } from "@/lib/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Volume");
  const navigate = useNavigate();

  const { data: summary } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: api.getAdminSummary,
    refetchInterval: 15000,
  });

  const { data: activityLog = [] } = useQuery({
    queryKey: ["admin-activity-log"],
    queryFn: api.getAdminActivityLog,
    refetchInterval: 15000,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  const { data: mapData } = useQuery({
    queryKey: ["public-map-data"],
    queryFn: api.getPublicMapData,
    refetchInterval: 15000,
  });

  // Generate dynamic alerts from high-severity complaints
  const alerts = complaints
    .filter(c => c.severity === "HIGH")
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3)
    .map((complaint, idx) => ({
      title: `${complaint.type} at ${complaint.location}`,
      desc: complaint.description || "Severe issue reported. Immediate attention required.",
      status: complaint.status === "SUBMITTED" ? "Immediate Attention" : "In Progress",
      statusColor: complaint.status === "SUBMITTED" ? "text-destructive" : "text-primary",
      icon: complaint.status === "SUBMITTED" ? "⚠️" : "🔧",
    }));

  // Calculate density from map data
  const totalReports = mapData ? (mapData.heatmapSummary.high + mapData.heatmapSummary.medium + mapData.heatmapSummary.low) : 0;

  const statCards = [
    { icon: BarChart3, label: "Total Complaints", value: summary ? String(summary.totalComplaints) : "...", badge: "+12% vs LY", color: "" },
    { icon: AlertTriangle, label: "Pending", value: summary ? String(summary.pending) : "...", badge: "Action Req.", color: "border-t-4 border-t-destructive" },
    { icon: Users, label: "In Progress", value: summary ? String(summary.inProgress) : "...", badge: "", color: "border-t-4 border-t-primary" },
    { icon: CheckCircle2, label: "Resolved", value: summary ? String(summary.resolved) : "...", badge: "", color: "border-t-4 border-t-teal" },
  ];

  // Build log entries with real complaint data
  const logEntries = activityLog.map((entry) => {
    const complaint = complaints.find(c => c.id === entry.complaintId);
    const createdTime = complaint?.createdAt ? new Date(complaint.createdAt).toLocaleString() : entry.time;
    const location = complaint?.location || "Municipal Zone";
    
    return {
      id: `#${entry.complaintId || "N/A"}`,
      type: complaint?.type || entry.action || "Report",
      location: location,
      time: createdTime,
      status: complaint?.status || "Updated",
      statusClass: complaint?.severity === "HIGH" 
        ? "bg-destructive/15 text-destructive"
        : complaint?.severity === "MEDIUM"
        ? "bg-primary/15 text-primary"
        : "bg-teal/15 text-teal",
    };
  });

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="overview" />

      {/* Main */}
      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 animate-fade-up">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">System Overview</h1>
              <p className="text-sm text-muted-foreground">Operational status and live sensor telemetry for Metropolitan Zone A.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Network Status</p>
              <p className="text-sm font-bold text-teal flex items-center gap-1.5 justify-end">
                <span className="h-2 w-2 rounded-full bg-teal" /> All Systems Optimal
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {statCards.map((stat) => (
              <div key={stat.label} className={`surface-card p-5 ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-muted-foreground mb-3" />
                {stat.badge && (
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${stat.label === "Pending" ? "bg-destructive/10 text-destructive" : "text-muted-foreground bg-secondary"}`}>
                    {stat.badge}
                  </span>
                )}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
            {/* Priority Alerts */}
            <div className="surface-card p-6">
              <h3 className="font-bold text-foreground mb-4">Priority Alerts</h3>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.title} className="flex gap-3">
                    <span className="text-xl">{alert.icon}</span>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground">{alert.desc}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${alert.statusColor}`}>{alert.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/admin/priority-queue")} className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                View Queue
              </button>
            </div>

            {/* Chart + Map */}
            <div className="space-y-4">
              <div className="surface-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-foreground">Monthly Trends</h3>
                  <div className="flex bg-secondary rounded-lg text-xs">
                    {["Volume", "Efficiency"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  {[40, 55, 80, 65, 45, 35, 50, 42, 38, 44, 48].map((h, i) => (
                    <div key={i} className="flex-1 bg-secondary hover:bg-primary/20 transition-colors rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                  {["JAN", "MAR", "MAY", "JUL", "SEP", "NOV"].map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>

              <div className="surface-card p-5 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-foreground">Active Distribution</h4>
                    <p className="text-xs text-muted-foreground">Real-time heat density</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active Reports</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{mapData ? totalReports : "..."} <span className="text-xs font-normal text-muted-foreground">in zone</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Density Index</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <span className={mapData && mapData.heatmapSummary.high > mapData.heatmapSummary.medium ? "text-destructive" : "text-primary"}>
                        {mapData?.heatmapSummary.high > 0 ? "HIGH" : mapData?.heatmapSummary.medium > 0 ? "MEDIUM" : "LOW"}
                      </span>
                      <TrendingUp className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="surface-card animate-fade-up" style={{ animationDelay: "300ms" }}>
            <div className="p-6 flex justify-between items-center border-b border-border">
              <h3 className="font-bold text-foreground text-lg">System Activity Log</h3>
              <div className="flex gap-3">
                <button onClick={() => navigate("/admin/complaints")} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 uppercase tracking-wider">
                  <Filter className="h-3.5 w-3.5" /> Filter
                </button>
                <button onClick={() => navigate("/admin/activity-log")} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 uppercase tracking-wider">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left px-6 py-3">Ref ID</th>
                    <th className="text-left px-6 py-3">Incident Type</th>
                    <th className="text-left px-6 py-3">Location</th>
                    <th className="text-left px-6 py-3">Timestamp</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logEntries.map((entry, index) => (
                    <tr key={`${entry.id}-${entry.time}-${index}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-teal">{entry.id}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{entry.type}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{entry.location}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{entry.time}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${entry.statusClass}`}>{entry.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-center">
              <button onClick={() => navigate("/admin/activity-log")} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                Load More Entries
              </button>
            </div>
          </div>
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default AdminDashboard;
