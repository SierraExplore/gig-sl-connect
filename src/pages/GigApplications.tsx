import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Star,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  worker: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    profile_photo_url: string | null;
    verification_status: string | null;
  };
}

interface Gig {
  id: string;
  title: string;
  city: string;
  pay_amount: number;
  max_applicants: number;
}

export default function GigApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [gig, setGig] = useState<Gig | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    type: "accept" | "reject";
    applicationId: string;
  } | null>(null);

  useEffect(() => {
    if (!user || !id) {
      navigate("/auth");
      return;
    }
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel("applications-detail")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `gig_id=eq.${id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, navigate]);

  async function fetchData() {
    if (!id) return;

    // Fetch gig
    const { data: gigData } = await supabase
      .from("gigs")
      .select("id, title, city, pay_amount, max_applicants")
      .eq("id", id)
      .single();

    if (gigData) {
      setGig(gigData);
    }

    // Fetch applications
    const { data: applicationsData } = await supabase
      .from("applications")
      .select(
        `
        id,
        status,
        cover_letter,
        applied_at,
        worker:profiles!applications_worker_id_fkey(
          id,
          full_name,
          email,
          phone,
          city,
          profile_photo_url,
          verification_status
        )
      `
      )
      .eq("gig_id", id)
      .order("applied_at", { ascending: false });

    if (applicationsData) {
      setApplications(applicationsData as unknown as Application[]);
    }

    setLoading(false);
  }

  async function updateApplicationStatus(applicationId: string, status: "accepted" | "rejected") {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: `Application ${status}` });

      // If accepted, create job instance
      if (status === "accepted") {
        const app = applications.find((a) => a.id === applicationId);
        if (app && id) {
          await supabase.from("job_instances").insert({
            gig_id: id,
            worker_id: app.worker.id,
            status: "scheduled",
          });
        }
      }

      fetchData();
    }
    setActionDialog(null);
  }

  const formatPay = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusConfig = {
    pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
    accepted: { icon: CheckCircle2, color: "bg-success/10 text-success", label: "Accepted" },
    rejected: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Rejected" },
    withdrawn: { icon: XCircle, color: "bg-muted text-muted-foreground", label: "Withdrawn" },
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

  if (!gig) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="glass-card p-12 text-center">
            <p>Gig not found</p>
            <Button className="mt-4" asChild>
              <Link to="/my-gigs">Back to My Gigs</Link>
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-3xl">
        <Link
          to="/my-gigs"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Gigs
        </Link>

        {/* Gig Header */}
        <Card className="glass-card p-6 mb-6">
          <h1 className="text-xl font-bold mb-2">{gig.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {gig.city}
            </div>
            <div className="font-medium text-foreground">
              {formatPay(gig.pay_amount)}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {applications.length} / {gig.max_applicants} applications
            </div>
          </div>
        </Card>

        {/* Applications */}
        <h2 className="text-lg font-semibold mb-4">
          Applications ({applications.length})
        </h2>

        <div className="space-y-4">
          {applications.length > 0 ? (
            applications.map((app) => {
              const status = statusConfig[app.status as keyof typeof statusConfig];
              const StatusIcon = status?.icon || Clock;

              return (
                <Card key={app.id} className="glass-card p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={app.worker.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {app.worker.full_name?.[0] || "W"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{app.worker.full_name}</p>
                          {app.worker.verification_status === "verified" && (
                            <Badge className="bg-success/10 text-success h-5 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                          {app.worker.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.worker.city}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </div>
                        </div>

                        {app.cover_letter && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <MessageSquare className="h-3 w-3" />
                              Cover Letter
                            </div>
                            <p className="text-sm">{app.cover_letter}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={status?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {app.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setActionDialog({ type: "reject", applicationId: app.id })
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setActionDialog({ type: "accept", applicationId: app.id })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    )}

                    {app.status === "accepted" && (
                      <div className="flex gap-2">
                        {app.worker.phone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${app.worker.phone}`}>
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </a>
                          </Button>
                        )}
                        {app.worker.email && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${app.worker.email}`}>
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="glass-card p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Workers will appear here once they apply for this gig
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Action Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === "accept" ? "Accept this application?" : "Reject this application?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === "accept"
                ? "The worker will be notified and a job instance will be created."
                : "The worker will be notified that their application was not selected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                actionDialog?.type === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              onClick={() =>
                actionDialog &&
                updateApplicationStatus(
                  actionDialog.applicationId,
                  actionDialog.type === "accept" ? "accepted" : "rejected"
                )
              }
            >
              {actionDialog?.type === "accept" ? "Accept" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
