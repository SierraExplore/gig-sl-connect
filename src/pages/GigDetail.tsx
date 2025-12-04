import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Briefcase,
  ArrowLeft,
  Share2,
  Heart,
  AlertCircle,
  Send,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Gig } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GigDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [profile, setProfile] = useState<{ role: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchGig();
      if (user) {
        checkApplication();
        fetchProfile();
      }
    }
  }, [id, user]);

  async function fetchGig() {
    const { data, error } = await supabase
      .from("gigs")
      .select(
        `
        *,
        category:gig_categories(*),
        employer:employers(
          *,
          profile:profiles(*)
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      navigate("/explore");
      return;
    }

    setGig(data as unknown as Gig);
    setLoading(false);
  }

  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single();

    if (data) {
      setProfile(data);
    }
  }

  async function checkApplication() {
    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("gig_id", id)
      .eq("worker_id", user!.id)
      .maybeSingle();

    setHasApplied(!!data);
  }

  async function handleApply() {
    if (!user) {
      navigate("/auth?signup=true&role=worker");
      return;
    }

    if (profile?.role === "employer") {
      toast({
        title: "Cannot apply",
        description: "Employers cannot apply to gigs. Switch to a worker account.",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    const { error } = await supabase.from("applications").insert({
      gig_id: id,
      worker_id: user.id,
      cover_letter: coverLetter || null,
    });

    setApplying(false);

    if (error) {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Application submitted!" });
      setHasApplied(true);
      setShowApplyDialog(false);
    }
  }

  const formatPay = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="h-96 animate-pulse bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!gig) return null;

  const isOwner =
    gig.employer?.profile?.id === user?.id ||
    gig.employer?.user_id === user?.id;

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Back Button */}
        <Link to="/explore" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-success/10 text-success">
                      {gig.status.replace("_", " ")}
                    </Badge>
                    {gig.delivery_type === "remote" && (
                      <Badge variant="outline">Remote</Badge>
                    )}
                    {gig.category && (
                      <Badge variant="secondary">
                        {gig.category.icon} {gig.category.name}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold">{gig.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Posted {new Date(gig.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{gig.city}</span>
                </div>
                {gig.duration_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{gig.duration_hours} hours</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{gig.max_applicants} spots</span>
                </div>
                {gig.start_time && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(gig.start_time).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {gig.description || "No description provided."}
                </p>
              </div>

              {gig.skill_requirements && gig.skill_requirements.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.skill_requirements.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gig.tags && gig.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gig.full_address && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">{gig.full_address}</p>
                </div>
              )}
            </Card>

            {/* Employer Card */}
            {gig.employer?.profile && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">About the Employer</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={gig.employer.profile.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {gig.employer.profile.full_name?.[0] || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">
                      {gig.employer.org_name || gig.employer.profile.full_name}
                    </p>
                    {gig.employer.org_type && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {gig.employer.org_type}
                      </p>
                    )}
                    {gig.employer.verification_level && gig.employer.verification_level > 1 && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Verified Employer</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="glass-card p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-primary">
                  {formatPay(gig.pay_amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {gig.payment_method || "Mobile Money"}
                </p>
              </div>

              {isOwner ? (
                <div className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link to={`/my-gigs/${gig.id}/applications`}>
                      View Applications
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/my-gigs/${gig.id}/edit`}>Edit Gig</Link>
                  </Button>
                </div>
              ) : hasApplied ? (
                <Button className="w-full" disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Applied
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      navigate("/auth?signup=true&role=worker");
                    } else {
                      setShowApplyDialog(true);
                    }
                  }}
                >
                  Apply Now
                </Button>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Report this gig</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for this Gig</DialogTitle>
            <DialogDescription>
              Tell the employer why you're a great fit for this job.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Write a brief cover letter (optional)..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applying}>
              <Send className="h-4 w-4 mr-2" />
              {applying ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
