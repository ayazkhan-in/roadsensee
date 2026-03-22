import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MapPin, AlertTriangle, Clock, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminConfirmDialog } from "@/components/AdminConfirmDialog";
import { api } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";

const AdminKanban = () => {
  const queryClient = useQueryClient();
  const { openConfirmDialog } = useAdmin();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-kanban-complaints"],
    queryFn: api.getComplaints,
    refetchInterval: 15000,
  });

  // Group complaints by status
  const statuses = ["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  const statusLabels: Record<string, string> = {
    SUBMITTED: "Reported",
    VERIFIED: "Verified",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Completed",
  };

  const columns = statuses.map((status) => ({
    status,
    title: statusLabels[status],
    complaints: complaints.filter((c) => c.status === status),
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "bg-destructive/10 border-destructive/20 text-destructive";
      case "MEDIUM":
        return "bg-primary/10 border-primary/20 text-primary";
      case "LOW":
        return "bg-teal/10 border-teal/20 text-teal";
      default:
        return "bg-secondary/50 border-secondary text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case "MEDIUM":
        return <Clock className="h-3.5 w-3.5" />;
      case "LOW":
        return <Zap className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveComplaintId(null);

    if (!over) return;

    const activeComplaintId = active.id as string;
    const overId = over.id as string;

    // Find the complaint and target status
    const complaint = complaints.find((c) => c.id === activeComplaintId);
    if (!complaint) return;

    const targetStatus = statuses.includes(overId)
      ? overId
      : complaints.find((c) => c.id === overId)?.status;

    if (!targetStatus || complaint.status === targetStatus) return;

    // Open confirmation dialog
    openConfirmDialog(
      `Move to ${statusLabels[targetStatus] || targetStatus}`,
      `Are you sure you want to move "${complaint.type}" to ${statusLabels[targetStatus] || targetStatus}?`,
      async () => {
        try {
          setMovingId(activeComplaintId);
          await api.updateComplaintStatus(activeComplaintId, { status: targetStatus });
          toast.success(`Complaint moved to ${statusLabels[targetStatus] || targetStatus}`);
          queryClient.invalidateQueries({ queryKey: ["admin-kanban-complaints"] });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to move complaint");
        } finally {
          setMovingId(null);
        }
      }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveComplaintId(event.active.id as string);
  };

  const activeComplaint = activeComplaintId
    ? complaints.find((complaint) => complaint.id === activeComplaintId)
    : null;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="kanban" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">Kanban Workflow Board</h1>
          <p className="text-sm text-muted-foreground mb-6">Drag complaints between columns to update their status.</p>

          <DndContext
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveComplaintId(null)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {columns.map((column) => (
                <div key={column.status} className="flex flex-col bg-secondary/20 rounded-lg overflow-hidden border border-border">
                  {/* Column Header */}
                  <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">{column.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {column.complaints.length} complaint{column.complaints.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Column Content */}
                  <SortableContext items={column.complaints.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    <KanbanDropZone status={column.status}>
                      {column.complaints.length > 0 ? (
                        column.complaints.map((complaint) => (
                          <KanbanCard
                            key={complaint.id}
                            complaint={complaint}
                            getSeverityColor={getSeverityColor}
                            getSeverityIcon={getSeverityIcon}
                            isMoving={movingId === complaint.id}
                          />
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No complaints</div>
                      )}
                    </KanbanDropZone>
                  </SortableContext>
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeComplaint ? (
                <div className="w-[240px] rotate-2 shadow-2xl z-[999]">
                  <KanbanCardPreview
                    complaint={activeComplaint}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      <AdminConfirmDialog />
      <ChatbotWidget />
    </div>
  );
};

interface KanbanCardProps {
  complaint: any;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => React.ReactNode;
  isMoving: boolean;
}

interface KanbanDropZoneProps {
  status: string;
  children: React.ReactNode;
}

const KanbanDropZone: React.FC<KanbanDropZoneProps> = ({ status, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-3 overflow-y-auto space-y-2 min-h-[400px] bg-secondary/5 transition-colors ${
        isOver ? "bg-primary/10" : ""
      }`}
    >
      {children}
    </div>
  );
};

const KanbanCard: React.FC<KanbanCardProps> = ({ complaint, getSeverityColor, getSeverityIcon, isMoving }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: complaint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: "box-shadow 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full text-left border-l-4 rounded-lg p-3 cursor-grab active:cursor-grabbing ${getSeverityColor(complaint.severity)} ${
        isDragging ? "opacity-20" : "hover:shadow-md transform hover:scale-105"
      } transition-all ${isMoving ? "animate-pulse" : ""}`}
    >
      <KanbanCardContent
        complaint={complaint}
        getSeverityIcon={getSeverityIcon}
      />

      {isMoving && <Loader2 className="h-3 w-3 animate-spin mt-2" />}
    </div>
  );
};

const KanbanCardPreview: React.FC<{
  complaint: any;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => React.ReactNode;
}> = ({ complaint, getSeverityColor, getSeverityIcon }) => {
  return (
    <div className={`w-full text-left border-l-4 rounded-lg p-3 cursor-grabbing ${getSeverityColor(complaint.severity)}`}>
      <KanbanCardContent
        complaint={complaint}
        getSeverityIcon={getSeverityIcon}
      />
    </div>
  );
};

const KanbanCardContent: React.FC<{
  complaint: any;
  getSeverityIcon: (severity: string) => React.ReactNode;
}> = ({ complaint, getSeverityIcon }) => {
  return (
    <>
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold tracking-wider">{complaint.id}</span>
        <div className="flex items-center gap-1">
          {getSeverityIcon(complaint.severity)}
          <span className="text-[10px] font-semibold">{complaint.severity}</span>
        </div>
      </div>

      {/* Card Title */}
      <p className="text-xs font-semibold truncate mb-2">{complaint.type}</p>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[10px] mb-3">
        <MapPin className="h-3 w-3" />
        <span className="truncate">{complaint.location}</span>
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="opacity-75">
          {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A"}
        </span>
        <span className="opacity-75">→</span>
      </div>

    </>
  );
};

export default AdminKanban;
