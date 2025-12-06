import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  Clock,
  CheckCircle2,
  MapPin,
  Edit2,
  Eye,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Gig {
  id: string;
  title: string;
  city: string;
  pay_amount: number;
  status: string;
  created_at: string;
  max_applicants: number;
  applications_count: number;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
  posted: { color: "bg-success/10 text-success", label: "Active" },
  matched: { color: "bg-primary/10 text-primary", label: "Matched" },
  in_progress: { color: "bg-warning/10 text-warning", label: "In Progress" },
  completed: { color: "bg-muted text-muted-foreground", label: "Completed" },
  cancelled: { color: "bg-destructive/10 text-destructive", label: "Cancelled" },
};

export default function MyGigs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteGigId, setDeleteGigId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchGigs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("my-gigs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gigs" },
        () => {
          fetchGigs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  async function fetchGigs() {
    if (!user) return;

    // Get employer id
    const { data: employer } = await supabase
      .from("employers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employer) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("gigs")
      .select("*")
      .eq("employer_id", employer.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Get application counts for each gig
      const gigsWithCounts = await Promise.all(
        data.map(async (gig) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("gig_id", gig.id);
          return {
            ...gig,
            applications_count: count || 0,
          };
        })
      );
      setGigs(gigsWithCounts);
    }
    setLoading(false);
  }

  async function deleteGig(id: string) {
    const { error } = await supabase.from("gigs").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete gig. It may have active applications.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Gig deleted" });
      fetchGigs();
    }
    setDeleteGigId(null);
  }

  async function updateGigStatus(id: string, status: "posted" | "cancelled") {
    const { error } = await supabase
      .from("gigs")
      .update({ status, posted_at: status === "posted" ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchGigs();
    }
  }

  const filteredGigs = gigs.filter((gig) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return gig.status === "posted";
    if (activeTab === "completed") return gig.status === "completed";
    if (activeTab === "draft") return gig.status === "draft";
    return true;
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
            <h1 className="text-2xl font-bold">My Gigs</h1>
            <p className="text-muted-foreground">
              Manage your posted gigs and applications
            </p>
          </div>
          <Button asChild>
            <Link to="/post-gig">
              <Plus className="h-4 w-4 mr-2" />
              Post New Gig
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({gigs.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({gigs.filter((g) => g.status === "posted").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({gigs.filter((g) => g.status === "completed").length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Drafts ({gigs.filter((g) => g.status === "draft").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredGigs.length > 0 ? (
              filteredGigs.map((gig) => {
                const status = statusConfig[gig.status] || statusConfig.draft;

                return (
                  <Card key={gig.id} className="glass-card p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{gig.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {gig.city}
                          </div>
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            {formatPay(gig.pay_amount)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {gig.applications_count} / {gig.max_applicants} applicants
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(gig.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {gig.applications_count > 0 && (
                          <Button size="sm" asChild>
                            <Link to={`/my-gigs/${gig.id}/applications`}>
                              <Users className="h-4 w-4 mr-1" />
                              View Applications
                            </Link>
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/gigs/${gig.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/my-gigs/${gig.id}/edit`}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {gig.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => updateGigStatus(gig.id, "posted")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {gig.status === "posted" && (
                              <DropdownMenuItem
                                onClick={() => updateGigStatus(gig.id, "cancelled" as "cancelled")}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteGigId(gig.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="glass-card p-12 text-center">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No gigs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Post your first gig to start finding workers
                </p>
                <Button asChild>
                  <Link to="/post-gig">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Gig
                  </Link>
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGigId} onOpenChange={() => setDeleteGigId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this gig?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All applications for this gig will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGigId && deleteGig(deleteGigId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
