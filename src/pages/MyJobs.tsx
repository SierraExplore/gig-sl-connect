import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  MapPin,
  Play,
  Pause,
  Camera,
  Upload,
  Star,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface JobInstance {
  id: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  worker_confirmed_payment: boolean;
  employer_confirmed_payment: boolean;
  gig: {
    id: string;
    title: string;
    city: string;
    pay_amount: number;
    employer: {
      id: string;
      org_name: string | null;
      profile: {
        id: string;
        full_name: string;
        profile_photo_url: string | null;
      };
    };
  };
  worker: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  scheduled: { color: "bg-warning/10 text-warning", label: "Scheduled", icon: Clock },
  in_progress: { color: "bg-primary/10 text-primary", label: "In Progress", icon: Play },
  verification_pending: { color: "bg-secondary/10 text-secondary", label: "Verification Pending", icon: Camera },
  completed: { color: "bg-success/10 text-success", label: "Completed", icon: CheckCircle2 },
  disputed: { color: "bg-destructive/10 text-destructive", label: "Disputed", icon: AlertCircle },
  cancelled: { color: "bg-muted text-muted-foreground", label: "Cancelled", icon: AlertCircle },
};

export default function MyJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [profile, setProfile] = useState<{ role: string } | null>(null);

  // Dialogs
  const [proofDialog, setProofDialog] = useState<JobInstance | null>(null);
  const [ratingDialog, setRatingDialog] = useState<JobInstance | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchJobs();

    // Realtime subscription
    const channel = supabase
      .channel("my-jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_instances" },
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  async function fetchProfile() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
  }

  async function fetchJobs() {
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("job_instances")
      .select(`
        *,
        gig:gigs(
          id,
          title,
          city,
          pay_amount,
          employer:employers(
            id,
            org_name,
            profile:profiles(id, full_name, profile_photo_url)
          )
        ),
        worker:profiles!job_instances_worker_id_fkey(
          id,
          full_name,
          profile_photo_url
        )
      `)
      .order("created_at", { ascending: false });

    if (profileData?.role === "worker") {
      query = query.eq("worker_id", user.id);
    } else {
      // Employer - get jobs for their gigs
      const { data: employer } = await supabase
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (employer) {
        const { data: gigs } = await supabase
          .from("gigs")
          .select("id")
          .eq("employer_id", employer.id);

        if (gigs && gigs.length > 0) {
          query = query.in("gig_id", gigs.map((g) => g.id));
        } else {
          setJobs([]);
          setLoading(false);
          return;
        }
      }
    }

    const { data } = await query;
    if (data) setJobs(data as unknown as JobInstance[]);
    setLoading(false);
  }

  async function startJob(jobId: string) {
    const { error } = await supabase
      .from("job_instances")
      .update({
        status: "in_progress",
        start_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job started!" });
      fetchJobs();
    }
  }

  async function uploadProof(file: File, jobId: string) {
    if (!user) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${jobId}/proof_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars") // Using avatars bucket for now
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Create verification log
    await supabase.from("verification_logs").insert({
      job_instance_id: jobId,
      actor_id: user.id,
      type: "proof_upload",
      media_url: urlData.publicUrl,
    });

    // Update job status
    await supabase
      .from("job_instances")
      .update({ status: "verification_pending" })
      .eq("id", jobId);

    setUploading(false);
    setProofDialog(null);
    toast({ title: "Proof uploaded!" });
    fetchJobs();
  }

  async function confirmCompletion(jobId: string, isEmployer: boolean) {
    const field = isEmployer ? "employer_confirmed_payment" : "worker_confirmed_payment";
    
    const { error } = await supabase
      .from("job_instances")
      .update({ [field]: true })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Check if both confirmed
    const { data: job } = await supabase
      .from("job_instances")
      .select("worker_confirmed_payment, employer_confirmed_payment")
      .eq("id", jobId)
      .single();

    if (job?.worker_confirmed_payment && job?.employer_confirmed_payment) {
      await supabase
        .from("job_instances")
        .update({ status: "completed", end_at: new Date().toISOString() })
        .eq("id", jobId);
      
      toast({ title: "Job completed!" });
    } else {
      toast({ title: "Confirmation recorded!" });
    }

    fetchJobs();
  }

  async function submitRating() {
    if (!ratingDialog || !user) return;
    setSubmittingRating(true);

    const isWorker = profile?.role === "worker";
    const ratedId = isWorker
      ? ratingDialog.gig.employer.profile.id
      : ratingDialog.worker.id;

    const { error } = await supabase.from("ratings").insert({
      job_instance_id: ratingDialog.id,
      rater_id: user.id,
      rated_id: ratedId,
      score: ratingScore,
      review: ratingReview || null,
    });

    setSubmittingRating(false);

    if (error) {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already rated", description: "You've already rated this job", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Rating submitted!" });
    }

    setRatingDialog(null);
    setRatingScore(5);
    setRatingReview("");
  }

  const formatPay = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "active") {
      return ["scheduled", "in_progress", "verification_pending"].includes(job.status);
    }
    if (activeTab === "completed") return job.status === "completed";
    return true;
  });

  const isWorker = profile?.role === "worker";

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground">
            Track and manage your {isWorker ? "work" : "hired workers"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Active ({jobs.filter((j) => ["scheduled", "in_progress", "verification_pending"].includes(j.status)).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({jobs.filter((j) => j.status === "completed").length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const status = statusConfig[job.status] || statusConfig.scheduled;
                const StatusIcon = status.icon;
                const otherParty = isWorker ? job.gig.employer.profile : job.worker;

                return (
                  <Card key={job.id} className="glass-card p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherParty?.profile_photo_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {otherParty?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <Link
                            to={`/gigs/${job.gig.id}`}
                            className="font-semibold text-lg hover:text-primary transition-colors"
                          >
                            {job.gig.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {isWorker ? "Employer" : "Worker"}: {otherParty?.full_name}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.gig.city}
                            </div>
                            <div className="font-medium text-foreground">
                              {formatPay(job.gig.pay_amount)}
                            </div>
                            {job.start_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Started {new Date(job.start_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <Badge className={`${status.color} mt-3`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* Action buttons based on status */}
                        {job.status === "scheduled" && isWorker && (
                          <Button size="sm" onClick={() => startJob(job.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            Start Job
                          </Button>
                        )}

                        {job.status === "in_progress" && isWorker && (
                          <Button size="sm" onClick={() => setProofDialog(job)}>
                            <Camera className="h-4 w-4 mr-1" />
                            Upload Proof
                          </Button>
                        )}

                        {job.status === "verification_pending" && (
                          <Button
                            size="sm"
                            onClick={() => confirmCompletion(job.id, !isWorker)}
                            disabled={isWorker ? job.worker_confirmed_payment : job.employer_confirmed_payment}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {(isWorker ? job.worker_confirmed_payment : job.employer_confirmed_payment)
                              ? "Confirmed"
                              : "Confirm Payment"}
                          </Button>
                        )}

                        {job.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRatingDialog(job)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Rate {isWorker ? "Employer" : "Worker"}
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
                <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isWorker
                    ? "Apply to gigs to start working"
                    : "Accept applications to hire workers"}
                </p>
                <Button asChild>
                  <Link to={isWorker ? "/explore" : "/my-gigs"}>
                    {isWorker ? "Explore Gigs" : "View My Gigs"}
                  </Link>
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Proof Upload Dialog */}
      <Dialog open={!!proofDialog} onOpenChange={() => setProofDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Proof of Work</DialogTitle>
            <DialogDescription>
              Take a photo or upload an image as proof of completed work.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && proofDialog) {
                  uploadProof(file, proofDialog.id);
                }
              }}
              className="hidden"
              id="proof-upload"
            />
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline" disabled={uploading}>
                <label htmlFor="proof-upload" className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Take Photo"}
                </label>
              </Button>
              <Button asChild variant="outline" disabled={uploading}>
                <label htmlFor="proof-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </label>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={!!ratingDialog} onOpenChange={() => setRatingDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your experience</DialogTitle>
            <DialogDescription>
              How was your experience with{" "}
              {isWorker
                ? ratingDialog?.gig.employer.profile.full_name
                : ratingDialog?.worker.full_name}
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="mb-2 block">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= ratingScore
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review">Review (optional)</Label>
              <Textarea
                id="review"
                placeholder="Share your experience..."
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitRating} disabled={submittingRating}>
              {submittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
