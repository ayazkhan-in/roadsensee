import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activePage:
    | "overview"
    | "complaints"
    | "priority-queue"
    | "assignments"
    | "activity-log"
    | "analytics"
    | "map"
    | "kanban"
    | "resolution";
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePage }) => {
  const isComplaintsSection = ["complaints", "priority-queue", "kanban", "resolution"].includes(activePage);
  const [complaintsExpanded, setComplaintsExpanded] = useState(
    isComplaintsSection
  );

  const isActive = (page: string) => activePage === page;

  const linkClass = (page: string) =>
    `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive(page)
        ? "bg-secondary text-foreground"
        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    }`;

  return (
    <aside className="hidden lg:flex w-52 border-r border-border bg-card flex-col min-h-screen fixed left-0 top-0 z-40">
      <div className="p-5">
        <h2 className="font-bold text-foreground">RoadSense Admin</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">City Council Portal</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <Link to="/admin" className={linkClass("overview")}>
          Overview
        </Link>

        {/* Complaints with Click Toggle Submenu */}
        <div>
          <button
            type="button"
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isComplaintsSection
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
            onClick={() => setComplaintsExpanded((prev) => !prev)}
            aria-expanded={complaintsExpanded}
            aria-controls="complaints-submenu"
          >
            <span>Complaints</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${complaintsExpanded ? "rotate-180" : ""}`} />
          </button>

          {complaintsExpanded && (
            <div id="complaints-submenu" className="mt-1 ml-2 mr-1 bg-card border border-border rounded-lg overflow-hidden">
              <Link
                to="/admin/complaints"
                className={`block px-4 py-2.5 text-xs border-b border-border/50 transition-colors ${
                  isActive("complaints")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                All Complaints
              </Link>
              <Link
                to="/admin/priority-queue"
                className={`block px-4 py-2.5 text-xs border-b border-border/50 transition-colors ${
                  isActive("priority-queue")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Priority Queue
              </Link>
              <Link
                to="/admin/kanban"
                className={`block px-4 py-2.5 text-xs transition-colors ${
                  isActive("kanban")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Kanban Board
              </Link>
            </div>
          )}
        </div>

        <Link to="/admin/assignments" className={linkClass("assignments")}>
          Assignments
        </Link>

        <Link to="/admin/activity-log" className={linkClass("activity-log")}>
          Activity Log
        </Link>

        <Link to="/admin/analytics" className={linkClass("analytics")}>
          Analytics
        </Link>

        <Link to="/admin/map" className={linkClass("map")}>
          Map
        </Link>
      </nav>

      <div className="p-3 space-y-2 border-t border-border">
        <Link to="/report">
          <Button className="w-full" size="sm">
            + New Report
          </Button>
        </Link>
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            AU
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-[10px] text-muted-foreground">District 4 Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
