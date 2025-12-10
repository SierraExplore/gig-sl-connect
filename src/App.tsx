import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import GigDetail from "./pages/GigDetail";
import PostGig from "./pages/PostGig";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyApplications from "./pages/MyApplications";
import MyGigs from "./pages/MyGigs";
import GigApplications from "./pages/GigApplications";
import Notifications from "./pages/Notifications";
import HowItWorks from "./pages/HowItWorks";
import Onboarding from "./pages/Onboarding";
import EditGig from "./pages/EditGig";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyJobs from "./pages/MyJobs";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/gigs/:id" element={<GigDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/users/:id" element={<UserProfile />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/post-gig" element={<PostGig />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/my-gigs" element={<MyGigs />} />
            <Route path="/my-gigs/:id/edit" element={<EditGig />} />
            <Route path="/my-gigs/:id/applications" element={<GigApplications />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
