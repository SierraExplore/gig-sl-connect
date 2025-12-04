import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Bell,
  User,
  Plus,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { GigCard } from "@/components/gigs/GigCard";

interface DashboardStats {
  activeGigs: number;
  completedJobs: number;
  pendingApplications: number;
  totalEarnings: number;
  averageRating: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    full_name: string;
    role: string;
    verification_status: string;
    profile_photo_url: string | null;
  } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeGigs: 0,
    completedJobs: 0,
    pendingApplications: 0,
    totalEarnings: 0,
    averageRating: 0,
  });
  const [recentGigs, setRecentGigs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  async function fetchDashboardData() {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, role, verification_status, profile_photo_url")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch role-specific data
    if (profileData?.role === "worker") {
      await fetchWorkerStats();
    } else if (profileData?.role === "employer") {
      await fetchEmployerStats();
    }

    // Fetch notifications
    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (notificationsData) {
      setNotifications(notificationsData);
    }

    setLoading(false);
  }

  async function fetchWorkerStats() {
    if (!user) return;

    // Applications count
    const { count: applicationsCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", user.id)
      .eq("status", "pending");

    // Completed jobs
    const { count: completedCount } = await supabase
      .from("job_instances")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", user.id)
      .eq("status", "completed");

    // Active jobs
    const { count: activeCount } = await supabase
      .from("job_instances")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", user.id)
      .in("status", ["scheduled", "in_progress"]);

    // Ratings
    const { data: ratings } = await supabase
      .from("ratings")
      .select("score")
      .eq("rated_id", user.id);

    const avgRating =
      ratings && ratings.length > 0
        ? ratings.reduce((a, b) => a + b.score, 0) / ratings.length
        : 0;

    setStats({
      activeGigs: activeCount || 0,
      completedJobs: completedCount || 0,
      pendingApplications: applicationsCount || 0,
      totalEarnings: 0, // Would need to calculate from completed jobs
      averageRating: avgRating,
    });

    // Recent applications with gig details
    const { data: applications } = await supabase
      .from("applications")
      .select(
        `
        *,
        gig:gigs(
          *,
          category:gig_categories(*),
          employer:employers(*, profile:profiles(*))
        )
      `
      )
      .eq("worker_id", user.id)
      .order("applied_at", { ascending: false })
      .limit(3);

    if (applications) {
      setRecentGigs(applications.map((a) => a.gig).filter(Boolean));
    }
  }

  async function fetchEmployerStats() {
    if (!user) return;

    // Get employer id
    const { data: employer } = await supabase
      .from("employers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employer) return;

    // Active gigs
    const { count: activeCount } = await supabase
      .from("gigs")
      .select("*", { count: "exact", head: true })
      .eq("employer_id", employer.id)
      .eq("status", "posted");

    // Completed gigs
    const { count: completedCount } = await supabase
      .from("gigs")
      .select("*", { count: "exact", head: true })
      .eq("employer_id", employer.id)
      .eq("status", "completed");

    // Pending applications for employer's gigs
    const { data: gigs } = await supabase
      .from("gigs")
      .select("id")
      .eq("employer_id", employer.id);

    let pendingCount = 0;
    if (gigs && gigs.length > 0) {
      const gigIds = gigs.map((g) => g.id);
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in("gig_id", gigIds)
        .eq("status", "pending");
      pendingCount = count || 0;
    }

    // Ratings for employer
    const { data: ratings } = await supabase
      .from("ratings")
      .select("score")
      .eq("rated_id", user.id);

    const avgRating =
      ratings && ratings.length > 0
        ? ratings.reduce((a, b) => a + b.score, 0) / ratings.length
        : 0;

    setStats({
      activeGigs: activeCount || 0,
      completedJobs: completedCount || 0,
      pendingApplications: pendingCount,
      totalEarnings: 0,
      averageRating: avgRating,
    });

    // Recent gigs
    const { data: recentGigsData } = await supabase
      .from("gigs")
      .select(
        `
        *,
        category:gig_categories(*),
        employer:employers(*, profile:profiles(*))
      `
      )
      .eq("employer_id", employer.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentGigsData) {
      setRecentGigs(recentGigsData);
    }
  }

  const verificationProgress = profile?.verification_status === "verified" ? 100 : 50;

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="grid gap-6">
            <Card className="h-32 animate-pulse bg-muted" />
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-24 animate-pulse bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {profile?.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {profile?.full_name?.split(" ")[0]}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">
                  {profile?.role}
                </Badge>
                {profile?.verification_status === "verified" ? (
                  <Badge className="bg-success/10 text-success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {profile?.role === "employer" ? (
              <Button asChild>
                <Link to="/post-gig">
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Gig
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/explore">Explore Gigs</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Verification Progress */}
        {profile?.verification_status !== "verified" && (
          <Card className="glass-card p-4 mb-6 border-warning/30 bg-warning/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <span className="font-medium">Complete your verification</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile">Complete Now</Link>
              </Button>
            </div>
            <Progress value={verificationProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {verificationProgress}% complete - Verified accounts get more opportunities
            </p>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeGigs}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === "employer" ? "Active Gigs" : "Active Jobs"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedJobs}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === "employer" ? "Pending Apps" : "Pending"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {profile?.role === "employer" ? "Your Gigs" : "Recent Applications"}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to={profile?.role === "employer" ? "/my-gigs" : "/my-applications"}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            {recentGigs.length > 0 ? (
              <div className="grid gap-4">
                {recentGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} variant="compact" />
                ))}
              </div>
            ) : (
              <Card className="glass-card p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  {profile?.role === "employer"
                    ? "Post your first gig to find workers"
                    : "Start applying to gigs to find work"}
                </p>
                <Button asChild>
                  <Link to={profile?.role === "employer" ? "/post-gig" : "/explore"}>
                    {profile?.role === "employer" ? "Post a Gig" : "Explore Gigs"}
                  </Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Notifications & Quick Actions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <Card key={notif.id} className="glass-card p-4">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card p-6 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </Card>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to={profile?.role === "employer" ? "/my-gigs" : "/my-applications"}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    {profile?.role === "employer" ? "Manage Gigs" : "My Applications"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
