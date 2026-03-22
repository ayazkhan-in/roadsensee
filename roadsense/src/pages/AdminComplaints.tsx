import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminConfirmDialog } from "@/components/AdminConfirmDialog";
import { api } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";

const AdminComplaints = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openConfirmDialog } = useAdmin();

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  // Filter complaints based on search
  const filteredComplaints = complaints.filter(
    (c) =>
      (c.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "text-destructive bg-destructive/10";
      case "MEDIUM":
        return "text-primary bg-primary/10";
      case "LOW":
        return "text-teal bg-teal/10";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <AlertTriangle className="h-4 w-4" />;
      case "MEDIUM":
        return <Clock className="h-4 w-4" />;
      case "LOW":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleVerify = (complaintId: string) => {
    openConfirmDialog(
      "Verify Complaint",
      "Are you sure you want to verify this complaint? This action cannot be undone.",
      async () => {
        try {
          setLoadingId(complaintId);
          await api.verifyComplaint(complaintId);
          toast.success("Complaint verified successfully");
          queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to verify complaint");
        } finally {
          setLoadingId(null);
        }
      }
    );
  };

  const handleAssign = (complaintId: string) => {
    navigate(`/admin/assignments?complaintId=${complaintId}`);
  };

  const handleReject = (complaintId: string) => {
    openConfirmDialog(
      "Reject Complaint",
      "Are you sure you want to reject this complaint? This action cannot be undone.",
      async () => {
        try {
          setLoadingId(complaintId);
          await api.rejectComplaint(complaintId, "Rejected by admin");
          toast.success("Complaint rejected successfully");
          queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to reject complaint");
        } finally {
          setLoadingId(null);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="complaints" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">Complaints Management</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Verify, reject, and assign {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""} from queue.
          </p>

          <div className="surface-card p-4 mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="bg-transparent outline-none text-sm w-full"
              placeholder="Search complaint ID or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="surface-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Location</th>
                  <th className="text-left px-6 py-3">Severity</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-teal">
                      <Link to={`/admin/kanban?complaintId=${complaint.id}`} className="hover:underline">
                        {complaint.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{complaint.type}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{complaint.location}</td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${getSeverityColor(complaint.severity)}`}>
                        {getSeverityIcon(complaint.severity)}
                        {complaint.severity}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-md font-medium ${
                          complaint.status === "OPEN"
                            ? "bg-destructive/10 text-destructive"
                            : complaint.status === "VERIFIED"
                            ? "bg-primary/10 text-primary"
                            : "bg-teal/10 text-teal"
                        }`}
                      >
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerify(complaint.id)}
                          disabled={loadingId === complaint.id}
                          className="text-blue-500 hover:text-blue-600 font-semibold disabled:opacity-50 flex items-center gap-1"
                        >
                          {loadingId === complaint.id && <Loader2 className="h-3 w-3 animate-spin" />}
                          Verify
                        </button>
                        <button
                          onClick={() => handleAssign(complaint.id)}
                          className="text-green-500 hover:text-green-600 font-semibold"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleReject(complaint.id)}
                          disabled={loadingId === complaint.id}
                          className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 flex items-center gap-1"
                        >
                          {loadingId === complaint.id && <Loader2 className="h-3 w-3 animate-spin" />}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredComplaints.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No complaints found matching your search.</div>
          )}
        </div>
      </main>

      <AdminConfirmDialog />
      <ChatbotWidget />
    </div>
  );
};

export default AdminComplaints;
