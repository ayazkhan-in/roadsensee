import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const Confirmation = () => {
  const { complaintId = "" } = useParams();

  const { data: complaint } = useQuery({
    queryKey: ["confirmation-complaint", complaintId],
    queryFn: () => api.getComplaintById(complaintId),
    enabled: Boolean(complaintId),
    refetchInterval: 15000,
  });

  const handleCopy = async () => {
    if (complaintId) {
      await navigator.clipboard.writeText(complaintId);
    }
  };

  const priorityTone = complaint?.priorityTag === "HIGH" ? "severity-high" : complaint?.priorityTag === "LOW" ? "severity-low" : "severity-medium";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="surface-card p-8 sm:p-10 text-center animate-fade-up">
          <CheckCircle2 className="h-14 w-14 text-teal mx-auto mb-4" />
          <p className="text-xs font-semibold uppercase tracking-widest text-teal mb-2">Complaint Submitted</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Issue Confirmation</h1>
          <p className="text-muted-foreground mb-8">
            {complaintId
              ? "Your complaint has been generated successfully and routed to the municipal workflow."
              : "Complaint reference is missing. Please submit a new issue."}
          </p>

          <div className="bg-secondary rounded-xl p-5 mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Complaint ID</p>
            <p className="text-xl font-bold tracking-wider text-foreground font-mono">{complaintId || "N/A"}</p>
            <button onClick={handleCopy} className="mt-3 text-sm text-teal hover:underline inline-flex items-center gap-1.5">
              <Copy className="h-4 w-4" /> Copy ID
            </button>
          </div>

          {complaint?.imageUrl ? (
            <div className="mb-6 rounded-xl overflow-hidden border border-border">
              <img src={complaint.imageUrl} alt="Uploaded complaint" className="w-full h-48 object-cover" />
            </div>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="surface-card p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Priority Tag</p>
              <span className={`${priorityTone} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md`}>
                {complaint?.priorityTag || complaint?.severity || "Pending"}
              </span>
            </div>
            <div className="surface-card p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Location Preview</p>
              <p className="text-sm text-foreground">{complaint?.location || "Location unavailable"}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/track/${complaintId}`}>
              <Button className="w-full sm:w-auto">Track Complaint</Button>
            </Link>
            <Link to="/feed">
              <Button variant="outline" className="w-full sm:w-auto">Back to Feed</Button>
            </Link>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default Confirmation;
