import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, User, Briefcase, MapPin, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  role: string;
  profile_photo_url: string | null;
  verification_status: string | null;
  created_at: string;
}

interface Rating {
  id: string;
  score: number;
  review: string | null;
  created_at: string;
  rater: {
    full_name: string;
    profile_photo_url: string | null;
  };
  job_instance: {
    gig: {
      title: string;
    };
  };
}

interface Skill {
  id: string;
  skill: {
    name: string;
    category: string | null;
  };
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState({
    completedJobs: 0,
    averageRating: 0,
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  async function fetchUserData() {
    if (!id) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch ratings
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(full_name, profile_photo_url),
        job_instance:job_instances(
          gig:gigs(title)
        )
      `)
      .eq("rated_id", id)
      .order("created_at", { ascending: false });

    if (ratingsData) {
      setRatings(ratingsData as unknown as Rating[]);
      
      const avgRating = ratingsData.length > 0
        ? ratingsData.reduce((a, b) => a + b.score, 0) / ratingsData.length
        : 0;
      
      setStats((prev) => ({
        ...prev,
        averageRating: avgRating,
        totalRatings: ratingsData.length,
      }));
    }

    // Fetch skills (for workers)
    if (profileData?.role === "worker") {
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select(`
          id,
          skill:skills(name, category)
        `)
        .eq("user_id", id);

      if (skillsData) {
        setSkills(skillsData as unknown as Skill[]);
      }
    }

    // Fetch completed jobs count
    const { count } = await supabase
      .from("job_instances")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", id)
      .eq("status", "completed");

    setStats((prev) => ({
      ...prev,
      completedJobs: count || 0,
    }));

    setLoading(false);
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="h-64 animate-pulse bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="glass-card p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">User not found</h3>
            <Button asChild>
              <Link to="/explore">Go to Explore</Link>
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
          to="/explore"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Profile Header */}
        <Card className="glass-card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {profile.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
                {profile.verification_status === "verified" && (
                  <Badge className="bg-success/10 text-success">Verified</Badge>
                )}
                {profile.city && (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.city}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <Calendar className="h-3 w-3 inline mr-1" />
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.completedJobs}</p>
                <p className="text-sm text-muted-foreground">Jobs Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                  {stats.averageRating > 0 && <Star className="h-4 w-4 fill-warning text-warning" />}
                </p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="reviews">
          <TabsList className="mb-6">
            <TabsTrigger value="reviews">Reviews ({ratings.length})</TabsTrigger>
            {profile.role === "worker" && (
              <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {ratings.length > 0 ? (
              ratings.map((rating) => (
                <Card key={rating.id} className="glass-card p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={rating.rater.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-muted">
                        {rating.rater.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{rating.rater.full_name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.score
                                  ? "fill-warning text-warning"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For: {rating.job_instance?.gig?.title || "Job"}
                      </p>
                      {rating.review && (
                        <p className="mt-2 text-sm">{rating.review}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="glass-card p-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  This user hasn't received any reviews yet.
                </p>
              </Card>
            )}
          </TabsContent>

          {profile.role === "worker" && (
            <TabsContent value="skills">
              {skills.length > 0 ? (
                <Card className="glass-card p-6">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">
                        {skill.skill.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="glass-card p-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No skills listed</h3>
                  <p className="text-muted-foreground">
                    This user hasn't added any skills yet.
                  </p>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
