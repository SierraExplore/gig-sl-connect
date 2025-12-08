import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Save,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const gigSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  city: z.string().min(1, "Please select a city"),
  full_address: z.string().optional(),
  pay_amount: z.coerce.number().min(10000, "Minimum pay is 10,000 SLL"),
  payment_method: z.string().default("mobile_money"),
  duration_hours: z.coerce.number().min(1).max(720).optional().nullable(),
  max_applicants: z.coerce.number().min(1).max(100).default(10),
  delivery_type: z.enum(["onsite", "remote"]).default("onsite"),
  category_id: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  tags: z.string().optional(),
  skill_requirements: z.string().optional(),
  status: z.enum(["draft", "posted", "cancelled"]).default("posted"),
});

type GigForm = z.infer<typeof gigSchema>;

const cities = [
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

export default function EditGig() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([]);

  const form = useForm<GigForm>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      pay_amount: 100000,
      payment_method: "mobile_money",
      max_applicants: 10,
      delivery_type: "onsite",
      status: "posted",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCategories();
    fetchGig();
  }, [user, id, navigate]);

  async function fetchCategories() {
    const { data } = await supabase.from("gig_categories").select("*").order("name");
    if (data) setCategories(data);
  }

  async function fetchGig() {
    if (!id || !user) return;

    const { data: gig, error } = await supabase
      .from("gigs")
      .select(`
        *,
        employer:employers!inner(user_id)
      `)
      .eq("id", id)
      .single();

    if (error || !gig) {
      toast({
        title: "Gig not found",
        variant: "destructive",
      });
      navigate("/my-gigs");
      return;
    }

    // Check ownership
    if (gig.employer.user_id !== user.id) {
      toast({
        title: "Access denied",
        description: "You can only edit your own gigs",
        variant: "destructive",
      });
      navigate("/my-gigs");
      return;
    }

    // Populate form
    form.reset({
      title: gig.title,
      description: gig.description || "",
      city: gig.city,
      full_address: gig.full_address || "",
      pay_amount: gig.pay_amount,
      payment_method: gig.payment_method || "mobile_money",
      duration_hours: gig.duration_hours,
      max_applicants: gig.max_applicants || 10,
      delivery_type: gig.delivery_type || "onsite",
      category_id: gig.category_id,
      start_time: gig.start_time ? new Date(gig.start_time).toISOString().slice(0, 16) : "",
      tags: gig.tags?.join(", ") || "",
      skill_requirements: gig.skill_requirements?.join(", ") || "",
      status: gig.status as "draft" | "posted" | "cancelled",
    });

    setLoading(false);
  }

  async function onSubmit(data: GigForm) {
    if (!id) return;

    setSaving(true);

    const tags = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : null;
    const skill_requirements = data.skill_requirements
      ? data.skill_requirements.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const { error } = await supabase
      .from("gigs")
      .update({
        title: data.title,
        description: data.description,
        city: data.city,
        full_address: data.full_address || null,
        pay_amount: data.pay_amount,
        payment_method: data.payment_method,
        duration_hours: data.duration_hours || null,
        max_applicants: data.max_applicants,
        delivery_type: data.delivery_type,
        category_id: data.category_id || null,
        start_time: data.start_time || null,
        tags,
        skill_requirements,
        status: data.status,
        posted_at: data.status === "posted" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast({
        title: "Failed to update gig",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Gig updated successfully!" });
      navigate(`/gigs/${id}`);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="h-64 animate-pulse bg-muted" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="glass-card p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Edit Gig</h1>
            <p className="text-muted-foreground">
              Update the details of your gig
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="posted">Active</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gig Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Delivery Driver Needed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the job, requirements, and expectations..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <MapPin className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pay_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pay Amount (SLL)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-10"
                            placeholder="100000"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-10"
                            placeholder="4"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_applicants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Workers</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-10"
                            placeholder="10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skill_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Driving, Communication, English..." {...field} />
                    </FormControl>
                    <FormDescription>Separate skills with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="urgent, weekend, flexible..." {...field} />
                    </FormControl>
                    <FormDescription>Separate tags with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
