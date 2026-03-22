import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import Landing from "./pages/Landing";
import UserAuth from "./pages/UserAuth";
import UserSignup from "./pages/UserSignup";
import AdminAuth from "./pages/AdminAuth";
import Feed from "./pages/Feed";
import ReportIssue from "./pages/ReportIssue";
import AIResult from "./pages/AIResult";
import Confirmation from "./pages/Confirmation";
import TrackingPage from "./pages/TrackingPage";
import PublicMap from "./pages/PublicMap";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminPriorityQueue from "./pages/AdminPriorityQueue";
import AdminKanban from "./pages/AdminKanban.tsx";
import AdminAssignments from "./pages/AdminAssignments";
import AdminMap from "./pages/AdminMap";
import ResolutionManager from "./pages/ResolutionManager";
import AdminActivityLog from "./pages/AdminActivityLog";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<UserAuth />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route path="/admin/auth" element={<AdminAuth />} />

            <Route
              path="/feed"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <ReportIssue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-result"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <AIResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/confirmation/:complaintId"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <Confirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track"
              element={
                <ProtectedRoute allowedRoles={["citizen", "admin"]}>
                  <TrackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track/:complaintId"
              element={
                <ProtectedRoute allowedRoles={["citizen", "admin"]}>
                  <TrackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute allowedRoles={["citizen", "admin"]}>
                  <PublicMap />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/priority-queue"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPriorityQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/kanban"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminKanban />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/map"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminMap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resolution/:complaintId"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ResolutionManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity-log"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminActivityLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
