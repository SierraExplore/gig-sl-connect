import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  MapPin, 
  Shield, 
  Smartphone, 
  Star, 
  Users, 
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Clock
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GigCard } from "@/components/gigs/GigCard";
import { CategoryFilter } from "@/components/gigs/CategoryFilter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Gig, GigCategory } from "@/types/database";

const stats = [
  { label: "Active Workers", value: "2,500+", icon: Users },
  { label: "Gigs Completed", value: "15,000+", icon: Briefcase },
  { label: "Cities Covered", value: "16", icon: MapPin },
  { label: "Avg. Rating", value: "4.8", icon: Star },
];

const features = [
  {
    icon: Shield,
    title: "Verified Users",
    description: "All workers and employers go through NIN verification for trust and safety.",
  },
  {
    icon: Smartphone,
    title: "QR Check-in",
    description: "Seamless job verification with QR codes for onsite work confirmation.",
  },
  {
    icon: MapPin,
    title: "Location Matching",
    description: "Find gigs near you with smart city-based job recommendations.",
  },
  {
    icon: TrendingUp,
    title: "Build Reputation",
    description: "Earn ratings and reviews to unlock more opportunities.",
  },
];

export default function Index() {
  const { user } = useAuth();
  const [featuredGigs, setFeaturedGigs] = useState<Gig[]>([]);
  const [categories, setCategories] = useState<GigCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [gigsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from("gigs")
          .select(`
            *,
            category:gig_categories(*),
            employer:employers(
              *,
              profile:profiles(*)
            )
          `)
          .eq("status", "posted")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("gig_categories").select("*").order("name"),
      ]);

      if (gigsResponse.data) {
        setFeaturedGigs(gigsResponse.data as unknown as Gig[]);
      }
      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              🇸🇱 Built for Sierra Leone
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
              Find Work.{" "}
              <span className="text-primary">Get Paid.</span>
              <br />
              Build Your Future.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              GigBox connects skilled workers with employers across Sierra Leone. 
              Verified profiles, secure verification, and flexible opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <>
                  <Link to="/explore">
                    <Button size="xl" variant="hero">
                      Browse Gigs
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/post-gig">
                    <Button size="xl" variant="hero-outline">
                      Post a Gig
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth?signup=true&role=worker">
                    <Button size="xl" variant="hero">
                      Find Work
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/auth?signup=true&role=employer">
                    <Button size="xl" variant="hero-outline">
                      Hire Workers
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass-card p-4 text-center">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gigs */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Latest Gigs</h2>
              <p className="text-muted-foreground">Fresh opportunities just posted</p>
            </div>
            <Link to="/explore">
              <Button variant="ghost">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onCategoryChange={setSelectedCategory} 
            />
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))}
            </div>
          ) : featuredGigs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredGigs.map((gig, index) => (
                <GigCard 
                  key={gig.id} 
                  gig={gig} 
                  variant={index === 0 ? "featured" : "default"} 
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card p-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No gigs posted yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to post a gig and find workers!</p>
              <Link to="/post-gig">
                <Button>Post a Gig</Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Browse by Category</h2>
            <p className="text-muted-foreground">Find gigs that match your skills</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link key={category.id} to={`/explore?category=${category.id}`}>
                <Card className="glass-card p-6 text-center card-hover">
                  <span className="text-4xl mb-3 block">{category.icon}</span>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Why GigBox?</h2>
            <p className="text-muted-foreground">Built for Sierra Leone's gig economy</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="glass-card p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-glow p-8 md:p-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to get started?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-6">
                Join thousands of workers and employers building Sierra Leone's future.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/auth?signup=true">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                    Create Free Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <span className="font-bold">GigBox SL</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 GigBox Sierra Leone. Built for the people. 🇸🇱
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
