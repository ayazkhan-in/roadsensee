import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { api } from "@/lib/api";

const AdminPriorityQueue = () => {
  const navigate = useNavigate();

  const { data: queueItems = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-priority-queue"],
    queryFn: api.getAdminPriorityQueue,
    refetchInterval: 15000,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-priority-queue-complaints"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  const complaintMap = new Map(complaints.map((complaint) => [complaint.id, complaint]));
  const rows = queueItems.map((item) => {
    const complaint = complaintMap.get(item.id);
    return {
      id: item.id,
      type: complaint?.type || "Road Issue",
      score: item.score,
      reason: item.reason,
      location: complaint?.location || "Location unavailable",
      status: complaint?.status || "OPEN",
    };
  });

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="priority-queue" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">AI Priority Queue</h1>
          <p className="text-sm text-muted-foreground mb-6">Live ranked complaints based on severity and risk indicators.</p>

          {isLoading && (
            <div className="surface-card p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading live priority queue...</span>
            </div>
          )}

          {isError && (
            <div className="surface-card p-10 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive font-medium">Failed to load priority queue</p>
              <p className="text-xs text-muted-foreground mt-1">{error instanceof Error ? error.message : "Please try again."}</p>
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <div className="surface-card p-10 text-center text-muted-foreground">
              No pending complaints in priority queue.
            </div>
          )}

          {!isLoading && !isError && rows.length > 0 && (
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={row.id} className="surface-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rank #{index + 1}</p>
                    <h3 className="text-lg font-bold text-foreground">{row.id} • {row.type}</h3>
                    <p className="text-sm text-muted-foreground">{row.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">{row.location} • {row.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Priority Score</p>
                    <p className="text-3xl font-bold text-destructive">{row.score.toFixed(1)}</p>
                    <button onClick={() => navigate(`/admin/resolution/${row.id}`)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Open</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default AdminPriorityQueue;
