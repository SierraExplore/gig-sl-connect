import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, MapPin, SlidersHorizontal } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GigCard } from "@/components/gigs/GigCard";
import { CategoryFilter } from "@/components/gigs/CategoryFilter";
import { supabase } from "@/integrations/supabase/client";
import type { Gig } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const cities = [
  "All Cities",
  "Freetown",
  "Bo",
  "Kenema",
  "Makeni",
  "Koidu",
  "Lunsar",
  "Port Loko",
  "Waterloo",
  "Bonthe",
  "Moyamba",
  "Kabala",
  "Magburaka",
  "Kailahun",
  "Pujehun",
  "Kambia",
  "Mattru Jong",
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [payRange, setPayRange] = useState([0, 5000000]);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchGigs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("gigs-realtime")
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
  }, [selectedCategory, selectedCity, payRange, sortBy]);

  async function fetchGigs() {
    setLoading(true);
    let query = supabase
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
      .eq("status", "posted");

    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }

    if (selectedCity !== "All Cities") {
      query = query.eq("city", selectedCity);
    }

    query = query
      .gte("pay_amount", payRange[0])
      .lte("pay_amount", payRange[1]);

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "pay_high") {
      query = query.order("pay_amount", { ascending: false });
    } else if (sortBy === "pay_low") {
      query = query.order("pay_amount", { ascending: true });
    }

    const { data } = await query;

    if (data) {
      let filteredGigs = data as unknown as Gig[];
      if (searchQuery) {
        filteredGigs = filteredGigs.filter(
          (gig) =>
            gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setGigs(filteredGigs);
    }
    setLoading(false);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGigs();
  };

  const formatPay = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Explore Gigs</h1>
          <p className="text-muted-foreground">
            Find opportunities that match your skills
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gigs by title or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="flex gap-2">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[160px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="pay_high">Pay: High to Low</SelectItem>
                <SelectItem value="pay_low">Pay: Low to High</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your gig search
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <Label className="mb-4 block">
                      Pay Range: {formatPay(payRange[0])} - {formatPay(payRange[1])}
                    </Label>
                    <Slider
                      value={payRange}
                      onValueChange={setPayRange}
                      min={0}
                      max={5000000}
                      step={100000}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Active Filters */}
        {(selectedCategory || selectedCity !== "All Cities") && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCity !== "All Cities" && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSelectedCity("All Cities")}
              >
                {selectedCity} ×
              </Badge>
            )}
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                Category Filter ×
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {gigs.length} gig{gigs.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : gigs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <Card className="glass-card p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No gigs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
