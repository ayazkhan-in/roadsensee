import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  variant?: "default" | "admin";
}

const Navbar = ({ variant = "default" }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const citizenLinks = [
    { to: "/", label: "Landing" },
    { to: "/feed", label: "Feed" },
    { to: "/report", label: "Report" },
    { to: "/track", label: "Track" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/complaints", label: "Complaints" },
    { to: "/admin/map", label: "Map" },
    { to: "/admin/activity-log", label: "Activity" },
  ];

  const links = user?.role === "admin" ? adminLinks : citizenLinks;
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    logout();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-foreground tracking-tight">
            RoadSense
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.to)
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {variant === "default" && (
              <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search areas..."
                  className="bg-transparent text-sm outline-none w-32 placeholder:text-muted-foreground"
                />
              </div>
            )}
            {!isAuthenticated && (
              <Link to={location.pathname.startsWith("/admin") ? "/admin/auth" : "/auth"}>
                <Button variant="outline" size="sm" className="font-medium">
                  Sign In
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Button variant="outline" size="sm" className="font-medium" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
