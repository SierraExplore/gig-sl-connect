import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

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

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<any[]>([]);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      city: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchSkills();
  }, [user, navigate]);

  async function fetchProfile() {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      form.reset({
        full_name: data.full_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
        city: data.city || "",
        address: data.address || "",
      });
    }
  }

  async function fetchSkills() {
    if (!user) return;

    // Fetch all skills
    const { data: allSkills } = await supabase
      .from("skills")
      .select("*")
      .order("name");

    if (allSkills) setSkills(allSkills);

    // Fetch user's skills
    const { data: userSkillsData } = await supabase
      .from("user_skills")
      .select("*, skill:skills(*)")
      .eq("user_id", user.id);

    if (userSkillsData) setUserSkills(userSkillsData);
  }

  async function onSubmit(data: ProfileForm) {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        city: data.city || null,
        address: data.address || null,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profile updated!" });
      fetchProfile();
    }
  }

  async function toggleSkill(skillId: string) {
    if (!user) return;

    const existing = userSkills.find((us) => us.skill_id === skillId);

    if (existing) {
      await supabase.from("user_skills").delete().eq("id", existing.id);
    } else {
      await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
      });
    }

    fetchSkills();
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="h-96 animate-pulse bg-muted" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass-card p-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize">
                      {profile.role}
                    </Badge>
                    {profile.verification_status === "verified" ? (
                      <Badge className="bg-success/10 text-success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-warning">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" disabled {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              placeholder="+232 XX XXX XXXX"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Your Skills</h2>
              <p className="text-muted-foreground mb-6">
                Select skills that match your abilities. This helps employers find you.
              </p>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const isSelected = userSkills.some(
                    (us) => us.skill_id === skill.id
                  );
                  return (
                    <Badge
                      key={skill.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {skill.name}
                    </Badge>
                  );
                })}
              </div>

              {skills.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No skills available. Check back later.
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Identity Verification</h2>
                  <p className="text-muted-foreground">
                    Verify your identity to build trust
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        profile.verification_status === "verified"
                          ? "bg-success text-success-foreground"
                          : "bg-muted-foreground/20"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">NIN Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Upload your National ID
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={
                      profile.verification_status === "verified"
                        ? "outline"
                        : "default"
                    }
                    size="sm"
                    disabled={profile.verification_status === "verified"}
                  >
                    {profile.verification_status === "verified"
                      ? "Verified"
                      : "Upload"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <Camera className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Selfie Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Take a photo to match your ID
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Photo
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
