import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Clock, Ruler, Layers, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import potholeSample from "@/assets/pothole-sample.jpg";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const AIResult = () => {
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const complaintId = searchParams.get("complaintId") || "";

  const { data: complaint } = useQuery({
    queryKey: ["ai-complaint", complaintId],
    queryFn: () => api.getComplaintById(complaintId),
    enabled: Boolean(complaintId),
    refetchInterval: 15000,
  });

  const { data: analysis } = useQuery({
    queryKey: ["ai-analysis", complaintId],
    queryFn: () =>
      api.analyzeIssue({
        description: complaint?.description || complaint?.location || "road issue",
        issueType: complaint?.type || "Pothole",
        imageUrl: complaint?.imageUrl,
      }),
    enabled: Boolean(complaintId && complaint),
    retry: false,
  });

  const detectedType = analysis?.classification || complaint?.type || "Road Issue";
  const detectedSeverity = analysis?.severity || complaint?.severity || "MEDIUM";
  const confidencePct = analysis ? `${Math.round(analysis.confidence * 100)}%` : "--";
  const severityWidth = detectedSeverity === "HIGH" ? "86%" : detectedSeverity === "LOW" ? "38%" : "64%";
  const severityTone =
    detectedSeverity === "HIGH"
      ? "text-destructive"
      : detectedSeverity === "LOW"
        ? "text-teal"
        : "text-amber-500";
  const barTone = detectedSeverity === "HIGH" ? "bg-destructive" : detectedSeverity === "LOW" ? "bg-teal" : "bg-amber-500";
  const aiSummary =
    analysis?.explanation ||
    "Our AI assistant analyzed your complaint details and generated a dynamic classification for dispatch prioritization.";

  const handleCopy = () => {
    if (!complaintId) {
      return;
    }
    navigator.clipboard.writeText(complaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!complaintId) {
      return;
    }
    await api.confirmComplaint(complaintId);
    navigate(`/confirmation/${complaintId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-fade-up">
          <span className="inline-block bg-teal/15 text-teal text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-md mb-4">
            Analysis Complete
          </span>
          <h1 className="text-4xl font-bold text-foreground mb-2">{detectedType} Detected</h1>
          <p className="text-muted-foreground max-w-lg mb-10">{aiSummary}</p>
        </div>

        {/* Main result */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="relative rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: "100ms" }}>
            <img
              src={complaint?.imageUrl || potholeSample}
              alt="Uploaded complaint"
              className="w-full h-full object-cover min-h-[320px]"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
              <p className="text-sm text-white/90 flex items-center gap-1.5">
                <span className="h-2 w-2 bg-teal rounded-full" /> {complaint?.location || "Reported location"}
              </p>
            </div>
          </div>

          <div className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="surface-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Detected Type</p>
                  <h2 className="text-3xl font-bold text-foreground">{detectedType}</h2>
                </div>
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Severity Level</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barTone}`} style={{ width: severityWidth }} />
                  </div>
                  <span className={`text-sm font-semibold ${severityTone}`}>{detectedSeverity}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">AI Confidence</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground tabular-nums">{confidencePct}</span>
                  <span className="text-sm font-medium text-teal">Reliable Match</span>
                </div>
              </div>
            </div>

            <Button className="w-full font-semibold" size="lg" onClick={handleConfirm}>
              Confirm & Dispatch
            </Button>
            <Link to={`/track/${complaintId}`}>
              <Button variant="outline" className="w-full font-semibold" size="lg">
                Request Manual Review
              </Button>
            </Link>
          </div>
        </div>

        {/* Details cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12 animate-fade-up" style={{ animationDelay: "300ms" }}>
          {[
            {
              icon: Clock,
              title: "Status",
              desc: complaint?.status ? `Current workflow state: ${complaint.status}` : "Current workflow state unavailable",
            },
            {
              icon: Ruler,
              title: "AI Severity",
              desc: `AI estimated severity as ${detectedSeverity} based on complaint context and uploaded evidence.`,
            },
            {
              icon: Layers,
              title: "Priority Tag",
              desc: complaint?.priorityTag ? `Dispatch priority: ${complaint.priorityTag}` : "Dispatch priority will be set after verification.",
            },
          ].map((item) => (
            <div key={item.title} className="surface-card p-5">
              <item.icon className="h-5 w-5 text-muted-foreground mb-3" />
              <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Ticket reference */}
        <div className="text-center animate-fade-up" style={{ animationDelay: "400ms" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Ticket Reference Identification</p>
          <div className="inline-block bg-secondary px-8 py-4 rounded-xl">
            <p className="text-lg font-bold text-foreground tracking-widest font-mono">{complaintId}</p>
          </div>
          <div className="mt-3">
            <button onClick={handleCopy} className="text-sm text-teal hover:underline flex items-center gap-1.5 mx-auto">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Tracking ID"}
            </button>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default AIResult;
