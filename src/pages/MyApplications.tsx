import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  gig: {
    id: string;
    title: string;
    city: string;
    pay_amount: number;
    status: string;
    start_time: string | null;
    employer: {
      org_name: string | null;
      profile: {
        full_name: string;
      };
    };
  };
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-warning/10 text-warning",
    label: "Pending",
  },
  accepted: {
    icon: CheckCircle2,
    color: "bg-success/10 text-success",
    label: "Accepted",
  },
  rejected: {
    icon: XCircle,
    color: "bg-destructive/10 text-destructive",
    label: "Rejected",
  },
  withdrawn: {
    icon: XCircle,
    color: "bg-muted text-muted-foreground",
    label: "Withdrawn",
  },
};

export default function MyApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchApplications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("applications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `worker_id=eq.${user.id}`,
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  async function fetchApplications() {
    if (!user) return;

    const { data } = await supabase
      .from("applications")
      .select(
        `
        *,
        gig:gigs(
          id,
          title,
          city,
          pay_amount,
          status,
          start_time,
          employer:employers(
            org_name,
            profile:profiles(full_name)
          )
        )
      `
      )
      .eq("worker_id", user.id)
      .order("applied_at", { ascending: false });

    if (data) {
      setApplications(data as unknown as Application[]);
    }
    setLoading(false);
  }

  async function withdrawApplication(id: string) {
    const { error } = await supabase
      .from("applications")
      .update({ status: "withdrawn" })
      .eq("id", id);

    if (!error) {
      fetchApplications();
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  const formatPay = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-muted" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Applications</h1>
            <p className="text-muted-foreground">
              Track your job applications and their status
            </p>
          </div>
          <Button asChild>
            <Link to="/explore">Find More Gigs</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({applications.filter((a) => a.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({applications.filter((a) => a.status === "accepted").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({applications.filter((a) => a.status === "rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {
                const status = statusConfig[app.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;

                return (
                  <Card key={app.id} className="glass-card p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={status?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status?.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">
                          {app.gig?.title || "Gig unavailable"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {app.gig?.employer?.org_name ||
                            app.gig?.employer?.profile?.full_name}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {app.gig?.city}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {formatPay(app.gig?.pay_amount || 0)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {app.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => withdrawApplication(app.id)}
                          >
                            Withdraw
                          </Button>
                        )}
                        {app.gig && (
                          <Button size="sm" asChild>
                            <Link to={`/gigs/${app.gig.id}`}>
                              View Gig
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="glass-card p-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start applying to gigs to find work opportunities
                </p>
                <Button asChild>
                  <Link to="/explore">Explore Gigs</Link>
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
