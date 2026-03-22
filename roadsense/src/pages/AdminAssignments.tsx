import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminConfirmDialog } from "@/components/AdminConfirmDialog";
import { api } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";

const AdminAssignments = () => {
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get("complaintId") || "";
  const [department, setDepartment] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { openConfirmDialog } = useAdmin();

  const { data: complaint } = useQuery({
    queryKey: ["complaint-detail", complaintId],
    queryFn: () => api.getComplaintById(complaintId),
    enabled: !!complaintId,
  });

  const handleSubmit = () => {
    if (!department || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    openConfirmDialog(
      "Assign Complaint",
      `Are you sure you want to assign this complaint to ${department}?`,
      async () => {
        try {
          setSubmitting(true);
          await api.assignComplaint(complaintId, {
            departmentId: department,
            deadline,
            notes,
          });
          toast.success("Complaint assigned successfully");
          queryClient.invalidateQueries({ queryKey: ["admin-kanban-complaints"] });
          setDepartment("");
          setDeadline("");
          setNotes("");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to assign complaint");
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="assignments" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">Task Assignment</h1>
          <p className="text-sm text-muted-foreground mb-6">Assign this complaint to a department with a deadline and notes.</p>

          <div className="surface-card p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Complaint ID</label>
              <input className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none" value={complaintId} readOnly />
            </div>

            {complaint && (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Type</label>
                  <input className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none" value={complaint.type} readOnly />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Location</label>
                  <input className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none" value={complaint.location} readOnly />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Assign To*</label>
              <select
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department...</option>
                <option value="road-works">Road Works Department</option>
                <option value="contractor-a">Contractor Team A</option>
                <option value="emergency">Emergency Crew</option>
                <option value="maintenance">Maintenance Team</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Deadline*</label>
              <input
                type="date"
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Notes</label>
              <textarea
                rows={4}
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none resize-none"
                placeholder="Add task notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !complaintId}
              className="w-full"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </div>
      </main>

      <AdminConfirmDialog />
      <ChatbotWidget />
    </div>
  );
};

export default AdminAssignments;
