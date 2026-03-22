import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";

const AdminResolution = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-52 border-r border-border bg-card flex-col min-h-screen fixed left-0 top-0 z-40">
        <div className="p-5">
          <h2 className="font-bold text-foreground">RoadSense Admin</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">City Council Portal</p>
        </div>
        <nav className="px-3 space-y-1">
          <Link to="/admin" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Overview</Link>
          <Link to="/admin/complaints" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Complaints</Link>
          <Link to="/admin/activity-log" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Activity Log</Link>
        </nav>
      </aside>

      <main className="flex-1 lg:ml-52 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">Resolution Verification</h1>
          <p className="text-sm text-muted-foreground mb-6">Upload before and after evidence to close complaint quality checks.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Before Image</p>
              <div className="bg-secondary rounded-xl h-48" />
            </div>
            <div className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">After Image</p>
              <div className="bg-secondary rounded-xl h-48" />
            </div>
          </div>

          <div className="surface-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Completion Status</p>
              <p className="text-lg font-semibold text-foreground">Ready for closure</p>
            </div>
            <button onClick={() => navigate("/admin/activity-log")} className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Mark as Resolved
            </button>
          </div>

          <Link to="/admin/complaints" className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground">
            Back to complaints
          </Link>
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default AdminResolution;
