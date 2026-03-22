import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, BarChart3, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const UserAuth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = async () => {
    setDemoSubmitting(true);
    try {
      const result = await api.login({ email: "citizen@roadsense.com", password: "password123" });
      login(result.accessToken, result.user);
      navigate("/feed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo login failed";
      if (/Failed to fetch|ERR_CONNECTION_REFUSED|NetworkError/i.test(message)) {
        login("demo-local-token", {
          id: "demo-citizen",
          name: "Demo Citizen",
          email: "citizen@roadsense.com",
          role: "citizen",
        });
        navigate("/feed");
      } else {
        alert(message);
      }
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.login({ email: identifier, password });
      login(result.accessToken, result.user);
      navigate("/feed");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Login failed");
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
          <div className="bg-primary text-primary-foreground p-10 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-3">RoadSense</h2>
            <p className="text-primary-foreground/70 mb-8 leading-relaxed">
              Precision infrastructure monitoring for a smarter, safer urban landscape.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Camera className="h-5 w-5 text-teal mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Instant Reporting</h4>
                  <p className="text-xs text-primary-foreground/60">Capture road issues and report them directly to municipal services.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <BarChart3 className="h-5 w-5 text-teal mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Real-time Tracking</h4>
                  <p className="text-xs text-primary-foreground/60">Monitor the progress of repairs and community safety metrics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="bg-card p-10">
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-8">Access your citizen dashboard</p>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Identifier</label>
                <input
                  type="text"
                  placeholder="Email or Phone Number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-ring transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                  <button type="button" onClick={() => navigate("/signup")} className="text-xs font-medium text-muted-foreground hover:text-foreground">Forgot?</button>
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
              <Button type="submit" className="w-full font-semibold" size="lg">
                {submitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase text-muted-foreground"><span className="bg-card px-3">Or</span></div>
            </div>

            <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleDemoLogin}>
              <Camera className="h-4 w-4" />
              {demoSubmitting ? "Starting Demo..." : "Demo User Login"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              New to the city?{" "}
              <Link to="/signup" className="font-medium text-foreground hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-muted-foreground space-x-6">
        <Link to="/" className="uppercase tracking-wider hover:text-foreground">Privacy Policy</Link>
        <Link to="/" className="uppercase tracking-wider hover:text-foreground">Infrastructure Terms</Link>
        <Link to="/" className="uppercase tracking-wider hover:text-foreground">Support Portal</Link>
      </footer>
      <p className="text-center text-xs text-muted-foreground pb-6">© 2024 RoadSense Infrastructure Editorial. All rights reserved.</p>
    </div>
  );
};

export default UserAuth;
