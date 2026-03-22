import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Camera, Cpu, Users, FileText, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import heroCity from "@/assets/hero-city.jpg";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const Landing = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [demoLoading, setDemoLoading] = useState<"citizen" | "admin" | null>(null);

  const handleDemoCitizen = async () => {
    setDemoLoading("citizen");
    try {
      const result = await api.login({ email: "citizen@roadsense.com", password: "password123" });
      login(result.accessToken, result.user);
      navigate("/feed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo user login failed";
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
      setDemoLoading(null);
    }
  };

  const handleDemoAdmin = async () => {
    setDemoLoading("admin");
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
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-block bg-secondary text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-md text-muted-foreground mb-6">
              City Infrastructure 2.0
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.05] text-foreground mb-2">
              Empowering Cities,
            </h1>
            <p className="text-5xl sm:text-6xl font-bold leading-[1.05] text-muted-foreground/50 mb-6">
              Enhancing Safety.
            </p>
            <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
              AI-driven road maintenance reporting and municipal response orchestration. Bridging the gap between citizens and city council with real-time data.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link to="/report">
                <Button size="lg" className="gap-2 font-semibold">
                  <Camera className="h-4 w-4" />
                  Report Issue (Citizen)
                </Button>
              </Link>
              <Link to="/admin/auth">
                <Button variant="outline" size="lg" className="font-semibold">
                  Admin Login
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium">Quick Demo:</span>
              <button type="button" onClick={handleDemoCitizen} className="font-semibold text-foreground hover:underline underline-offset-2">
                {demoLoading === "citizen" ? "SIGNING IN..." : "DEMO USER LOGIN"}
              </button>
              <span>|</span>
              <button type="button" onClick={handleDemoAdmin} className="font-semibold text-foreground hover:underline underline-offset-2">
                {demoLoading === "admin" ? "SIGNING IN..." : "DEMO ADMIN LOGIN"}
              </button>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "150ms" }}>
            <img
              src={heroCity}
              alt="Modern city infrastructure"
              className="w-full rounded-2xl shadow-lg object-cover aspect-[4/3]"
            />
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg max-w-[240px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                <span className="text-xs font-semibold text-teal uppercase tracking-wide">Live Feed</span>
              </div>
              <p className="text-xs text-foreground leading-snug">
                New pothole reported in Downtown District. AI processing status: High Precision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-card border-y border-border/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Infrastructure Intelligence</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Our seamless 3-step process ensures every citizen report is verified by AI and dispatched to city maintenance teams instantly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, step: "1. Upload Image", desc: "Citizens capture road damage through our mobile-first portal. GPS data is automatically tagged for precision location tracking.", color: "bg-primary" },
              { icon: Cpu, step: "2. AI Analysis", desc: "Our proprietary computer vision models categorize damage severity and provide cost estimations for immediate municipal triage.", color: "bg-teal" },
              { icon: Users, step: "3. City Action", desc: "Verified tasks are pushed to council dashboard for maintenance dispatch. Citizens track progress from report to resolution.", color: "bg-navy-light" },
            ].map((item, i) => (
              <div
                key={i}
                className="surface-card p-6 hover:shadow-md transition-shadow group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`${item.color} text-primary-foreground h-11 w-11 rounded-lg flex items-center justify-center mb-5`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.step}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i === 2 && <div className="h-1 w-full bg-teal rounded-full mt-5" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img src={heroCity} alt="Infrastructure" className="rounded-xl object-cover aspect-square" />
              <div className="bg-primary text-primary-foreground rounded-xl flex flex-col items-center justify-center p-6">
                <span className="text-4xl font-bold">94%</span>
                <span className="text-xs uppercase tracking-widest mt-1 opacity-80">Accuracy Rate</span>
              </div>
              <div className="bg-primary text-primary-foreground rounded-xl flex flex-col items-center justify-center p-6">
                <span className="text-4xl font-bold">2.4k</span>
                <span className="text-xs uppercase tracking-widest mt-1 opacity-80">Repairs Logged</span>
              </div>
              <img src={heroCity} alt="City view" className="rounded-xl object-cover aspect-square" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4 italic">Designed for Modern Municipalities</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                RoadSense provides city councils with a unified command center. From citizen engagement metrics to long-term infrastructure planning, our platform turns community reports into actionable intelligence.
              </p>
              <ul className="space-y-3 mb-8">
                {["Automated Triage & Prioritization", "Real-time Citizen Notification System", "Budget & Resource Optimization AI"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="h-5 w-5 rounded-full bg-teal/15 text-teal flex items-center justify-center text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/admin/auth">
                <Button className="gap-2">
                  Request Demo Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-foreground text-lg mb-2">RoadSense</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The digital backbone of urban infrastructure maintenance. Connecting citizens and local government through intelligent technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/feed" className="hover:text-foreground transition-colors">Citizen Portal</Link></li>
                <li><Link to="/admin" className="hover:text-foreground transition-colors">Admin Console</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">API Documentation</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Support Center</Link></li>
                <li><Link to="/admin/auth" className="hover:text-foreground transition-colors">Partner with Us</Link></li>
                <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
            <span>© 2024 RoadSense Infrastructure Labs. All rights reserved.</span>
            <div className="flex gap-4 mt-2 sm:mt-0">
              <Link to="/admin/activity-log" className="hover:text-foreground">Security</Link>
              <Link to="/" className="hover:text-foreground">Terms of Use</Link>
            </div>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
};

export default Landing;
