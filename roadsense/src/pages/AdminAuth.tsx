import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const AdminAuth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = async () => {
    setDemoSubmitting(true);
    try {
      const result = await api.adminLogin({ email: "admin@roadsense.com", password: "admin1234" });
      login(result.accessToken, result.user);
      navigate("/admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo admin login failed";
      if (/Failed to fetch|ERR_CONNECTION_REFUSED|NetworkError/i.test(message)) {
        login("demo-local-token", {
          id: "demo-admin",
          name: "Demo Admin",
          email: "admin@roadsense.com",
          role: "admin",
        });
        navigate("/admin");
      } else {
        alert(message);
      }
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.adminLogin({ email, password });
      login(result.accessToken, result.user);
      navigate("/admin");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl shadow-lg border border-border/50 animate-fade-up">
          {/* Left panel */}
          <div className="bg-primary text-primary-foreground p-10 flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Shield className="h-5 w-5 text-teal" />
                <span className="font-bold">RoadSense Admin</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight mb-4">
                Secure Gateway for Municipal Infrastructure
              </h2>
              <p className="text-sm text-primary-foreground/60 leading-relaxed">
                Access the centralized command center for real-time road maintenance, incident management, and urban data analytics.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3 mt-6">
              <Shield className="h-5 w-5 text-teal shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">Security Protocol</p>
                <p className="text-xs text-primary-foreground/50">AES-256 Multi-Layer Encryption</p>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="bg-card p-10">
            <h2 className="text-2xl font-bold text-foreground mb-1">Administrator Login</h2>
            <p className="text-sm text-muted-foreground mb-8">Please enter your credentials to access the council portal.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Access Role</label>
                <select className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-ring transition-colors">
                  <option>Department Head</option>
                  <option>Field Supervisor</option>
                  <option>System Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Work Email</label>
                <input
                  type="email"
                  placeholder="admin@citycouncil.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-ring transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                  <button type="button" onClick={() => navigate("/admin/auth")} className="text-xs font-semibold text-muted-foreground hover:text-foreground uppercase">Forgot?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-ring transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                Remember this device for 30 days
              </label>
              <Button type="submit" className="w-full font-semibold gap-2" size="lg">
                {submitting ? "Authorizing..." : "Authorize Access"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase text-muted-foreground"><span className="bg-card px-3">System Evaluation</span></div>
            </div>

            <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleDemoLogin}>
              <Users className="h-4 w-4" />
              {demoSubmitting ? "Starting Demo..." : "Demo Admin Login"}
            </Button>

            <div className="flex justify-center gap-6 mt-8 text-xs text-muted-foreground">
              <Link to="/" className="uppercase tracking-wider hover:text-foreground">Privacy Policy</Link>
              <Link to="/admin/activity-log" className="uppercase tracking-wider hover:text-foreground">Security Audit</Link>
              <Link to="/admin/analytics" className="uppercase tracking-wider hover:text-foreground">Contact IT Support</Link>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground pb-6 uppercase tracking-wider">
        Authorized personnel only • IP Logged: 192.168.1.104
      </p>
    </div>
  );
};

export default AdminAuth;
