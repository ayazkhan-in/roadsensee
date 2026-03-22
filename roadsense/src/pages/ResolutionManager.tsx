import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, User, Calendar, AlertTriangle, CheckCircle2, Clock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ChatbotWidget from "@/components/ChatbotWidget";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminConfirmDialog } from "@/components/AdminConfirmDialog";
import { api } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";

const ResolutionManager = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openConfirmDialog } = useAdmin();

  const [resolutionNotes, setResolutionNotes] = useState("");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  if (!complaintId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No complaint ID provided</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["admin-complaint-detail", complaintId],
    queryFn: () => api.getComplaintById(complaintId),
    refetchInterval: 10000,
  });

  const { data: officers = [] } = useQuery({
    queryKey: ["admin-officers"],
    queryFn: api.getOfficers,
  });

  const { data: assignmentSuggestion } = useQuery({
    queryKey: ["assignment-suggestion", complaint?.id, complaint?.severity],
    queryFn: () => api.getAssignmentSuggestion({ severity: complaint?.severity || "MEDIUM" }),
    enabled: Boolean(complaint?.id && complaint?.severity),
  });

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!complaint) return;

      openConfirmDialog(
        "Update Status",
        `Are you sure you want to change the status to "${newStatus}"?`,
        async () => {
          try {
            setSelectedStatus(newStatus);
            await api.updateComplaintStatus(complaintId, { status: newStatus });
            toast.success("Status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail"] });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update status");
          } finally {
            setSelectedStatus("");
          }
        }
      );
    },
    [complaint, complaintId, openConfirmDialog, queryClient]
  );

  const handleAssignOfficer = useCallback(async () => {
    if (!complaint || !assignedOfficer) {
      toast.error("Please select an officer");
      return;
    }

    const officer = officers.find((o) => o.id === assignedOfficer);
    openConfirmDialog(
      "Assign Officer",
      `Are you sure you want to assign this complaint to ${officer?.name}?`,
      async () => {
        try {
          setIsSubmitting(true);
          await api.assignComplaintToOfficer(complaintId, {
            officerId: assignedOfficer,
          });
          toast.success(`Complaint assigned to ${officer?.name}`);
          setAssignedOfficer("");
          queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail"] });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to assign complaint");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  }, [complaint, assignedOfficer, officers, complaintId, openConfirmDialog, queryClient]);

  const handleAddResolution = useCallback(async () => {
    if (!complaint || !resolutionNotes.trim()) {
      toast.error("Please enter resolution notes");
      return;
    }

    openConfirmDialog(
      "Add Resolution",
      "Are you sure you want to add these resolution notes?",
      async () => {
        try {
          setIsSubmitting(true);
          await api.addComplaintResolution(complaintId, {
            notes: resolutionNotes,
            resolvedDate: new Date().toISOString(),
          });
          const verification = await api.verifyRepair({
            complaintId,
            notes: resolutionNotes,
          });
          toast.success("Resolution notes added successfully");
          toast.message(`AI verification: ${verification.message}`);
          setResolutionNotes("");
          queryClient.invalidateQueries({ queryKey: ["admin-complaint-detail"] });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to add resolution");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  }, [complaint, resolutionNotes, complaintId, openConfirmDialog, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar activePage="kanban" />
        <main className="flex-1 lg:ml-52 p-6 lg:p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading complaint details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar activePage="kanban" />
        <main className="flex-1 lg:ml-52 p-6 lg:p-10">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Complaint not found</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => navigate("/admin/kanban")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Kanban
          </Button>
        </main>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "VERIFIED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activePage="kanban" />

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto animate-fade-up">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate("/admin/kanban")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Kanban
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Resolution Manager</h1>
            <p className="text-muted-foreground">ID: {complaint.id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Complaint Details Card */}
              <Card className="p-6 border-l-4 border-l-primary">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{complaint.type}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{complaint.description}</p>
                  </div>
                  <Badge variant={getSeverityColor(complaint.severity) as any}>{complaint.severity} SEVERITY</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold text-foreground">{complaint.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reporter</p>
                      <p className="font-semibold text-foreground">{complaint.reporterName || "Anonymous"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reported Date</p>
                      <p className="font-semibold text-foreground">
                        {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-semibold text-foreground">{complaint.category || "General"}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Resolution Workflow Tabs */}
              <Tabs defaultValue="status" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="assign">Assign Officer</TabsTrigger>
                  <TabsTrigger value="resolution">Resolution</TabsTrigger>
                </TabsList>

                {/* Status Tab */}
                <TabsContent value="status" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Update Status</h3>
                    <p className="text-sm text-muted-foreground mb-4">Current Status: {complaint.status}</p>
                    <div className="space-y-3">
                      {["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((status) => (
                        <Button
                          key={status}
                          variant={complaint.status === status ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleStatusChange(status)}
                          disabled={selectedStatus !== "" || complaint.status === status}
                        >
                          {selectedStatus === status && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {status}
                        </Button>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* Assign Officer Tab */}
                <TabsContent value="assign" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Assign to Officer</h3>
                    {assignmentSuggestion ? (
                      <Alert className="mb-4">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          AI suggestion: {assignmentSuggestion.recommendedTeam} (ETA {assignmentSuggestion.etaHours}h)
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {complaint.assignedOfficer && (
                      <Alert className="mb-4">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>Currently assigned to: {complaint.assignedOfficer.name}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-4">
                      <Select value={assignedOfficer} onValueChange={setAssignedOfficer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {officers.map((officer) => (
                            <SelectItem key={officer.id} value={officer.id}>
                              {officer.name} ({officer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAssignOfficer} disabled={isSubmitting || !assignedOfficer} className="w-full">
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Assign Officer
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                {/* Resolution Tab */}
                <TabsContent value="resolution" className="space-y-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Add Resolution Notes</h3>
                    {complaint.resolution && (
                      <Alert className="mb-4">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{complaint.resolution.notes}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Enter resolution notes..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="min-h-[150px] resize-none"
                        disabled={isSubmitting}
                      />
                      <Button onClick={handleAddResolution} disabled={isSubmitting || !resolutionNotes.trim()} className="w-full">
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Resolution
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Timeline & Status */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Timeline</h3>

                <div className="space-y-4">
                  {/* Current Status */}
                  <div className="pb-4 border-b border-border">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{complaint.status}</span>
                    </div>
                  </div>

                  {/* Key Dates */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">KEY DATES</p>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Reported</p>
                        <p className="font-semibold text-foreground">
                          {complaint.createdAt
                            ? new Date(complaint.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      {complaint.updatedAt && (
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="font-semibold text-foreground">
                            {new Date(complaint.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Officer */}
                  {complaint.assignedOfficer && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ASSIGNED OFFICER</p>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <p className="font-semibold text-foreground text-sm">{complaint.assignedOfficer.name}</p>
                        <p className="text-xs text-muted-foreground">{complaint.assignedOfficer.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <AdminConfirmDialog />
      <ChatbotWidget />
    </div>
  );
};

export default ResolutionManager;
