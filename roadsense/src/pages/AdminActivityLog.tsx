import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { api } from "@/lib/api";

const actionLabels: Record<string, string> = {
  SUBMITTED: "Complaint submitted",
  VERIFIED: "Verified by admin",
  ASSIGNED: "Assigned to department",
  IN_PROGRESS: "Work started",
  RESOLVED: "Marked as resolved",
  REJECTED: "Rejected by admin",
};

const formatLogTime = (isoTime: string) => {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return isoTime;
  return date.toLocaleString();
};

const AdminActivityLog = () => {
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const { data: activityLog = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-activity-log-live"],
    queryFn: api.getAdminActivityLog,
    refetchInterval: 15000,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-activity-log-complaints"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  const complaintMap = new Map(complaints.map((complaint) => [complaint.id, complaint]));
  const entries = activityLog.map((log, index) => {
    const complaint = complaintMap.get(log.complaintId);
    return {
      key: `${log.complaintId}-${log.time}-${index}`,
      time: formatLogTime(log.time),
      complaintId: log.complaintId,
      action: actionLabels[log.action] || log.action,
      location: complaint?.location || "Location unavailable",
      type: complaint?.type || "Road Issue",
    };
  });

  const filteredEntries = useMemo(() => {
    if (actionFilter === "ALL") return entries;
    return entries.filter((entry) => entry.action === (actionLabels[actionFilter] || actionFilter));
  }, [actionFilter, entries]);

  const exportCsv = () => {
    if (filteredEntries.length === 0) return;

    const header = ["Time", "Complaint ID", "Issue", "Location", "Action"];
    const rows = filteredEntries.map((entry) => [entry.time, entry.complaintId, entry.type, entry.location, entry.action]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roadsense-activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="activity-log" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">Activity Log</h1>
          <p className="text-sm text-muted-foreground mb-6">Live action history for transparency and audit trail.</p>

          <div className="surface-card p-3 mb-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Filter</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-secondary rounded-md px-3 py-1.5 text-sm outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="VERIFIED">Verified</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredEntries.length === 0}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          {isLoading && (
            <div className="surface-card p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading activity log...</span>
            </div>
          )}

          {isError && (
            <div className="surface-card p-10 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive font-medium">Failed to load activity log</p>
              <p className="text-xs text-muted-foreground mt-1">{error instanceof Error ? error.message : "Please try again."}</p>
            </div>
          )}

          {!isLoading && !isError && filteredEntries.length === 0 && (
            <div className="surface-card p-10 text-center text-muted-foreground">
              No activity available yet.
            </div>
          )}

          {!isLoading && !isError && filteredEntries.length > 0 && (
          <div className="surface-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left px-6 py-3">Time</th>
                  <th className="text-left px-6 py-3">Complaint ID</th>
                  <th className="text-left px-6 py-3">Issue</th>
                  <th className="text-left px-6 py-3">Location</th>
                  <th className="text-left px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.key} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.time}</td>
                    <td className="px-6 py-4 text-sm font-medium text-teal">{entry.complaintId}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{entry.type}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.location}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{entry.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default AdminActivityLog;
