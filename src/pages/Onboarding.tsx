import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Skill {
  id: string;
  name: string;
  category: string | null;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    full_name: string;
    phone: string;
    city: string;
    address: string;
    role: string;
    profile_photo_url: string | null;
  } | null>(null);

  // Step 1: Profile info
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 3: Skills (for workers)
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  const totalSteps = profile?.role === "worker" ? 4 : 3;

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
      setPhone(data.phone || "");
      setCity(data.city || "");
      setAddress(data.address || "");
      setPhotoUrl(data.profile_photo_url);
    }
  }

  async function fetchSkills() {
    const { data } = await supabase.from("skills").select("*").order("name");
    if (data) setSkills(data);

    // Fetch user's existing skills
    if (user) {
      const { data: userSkills } = await supabase
        .from("user_skills")
        .select("skill_id")
        .eq("user_id", user.id);

      if (userSkills) {
        setSelectedSkills(userSkills.map((s) => s.skill_id));
      }
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ profile_photo_url: publicUrl })
      .eq("id", user.id);

    setPhotoUrl(publicUrl);
    setUploading(false);
    toast({ title: "Photo uploaded!" });
  }

  async function saveProfileInfo() {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
        city,
        address,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  async function toggleSkill(skillId: string) {
    if (!user) return;

    if (selectedSkills.includes(skillId)) {
      await supabase
        .from("user_skills")
        .delete()
        .eq("user_id", user.id)
        .eq("skill_id", skillId);

      setSelectedSkills((prev) => prev.filter((id) => id !== skillId));
    } else {
      await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
      });

      setSelectedSkills((prev) => [...prev, skillId]);
    }
  }

  async function addCustomSkill() {
    if (!customSkill.trim() || !user) return;

    const skillName = customSkill.trim();

    // Check if skill exists
    let { data: existingSkill } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", skillName)
      .maybeSingle();

    let skillId: string;

    if (existingSkill) {
      skillId = existingSkill.id;
    } else {
      const { data: newSkill, error } = await supabase
        .from("skills")
        .insert({ name: skillName })
        .select("id")
        .single();

      if (error || !newSkill) {
        toast({
          title: "Error adding skill",
          description: error?.message,
          variant: "destructive",
        });
        return;
      }

      skillId = newSkill.id;
      setSkills((prev) => [...prev, { id: skillId, name: skillName, category: null }]);
    }

    // Add to user skills
    if (!selectedSkills.includes(skillId)) {
      await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
      });

      setSelectedSkills((prev) => [...prev, skillId]);
    }

    setCustomSkill("");
    toast({ title: "Skill added!" });
  }

  async function handleNext() {
    if (step === 1) {
      if (!city) {
        toast({
          title: "Please select your city",
          variant: "destructive",
        });
        return;
      }
      const saved = await saveProfileInfo();
      if (saved) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && profile?.role === "worker") {
      setStep(4);
    } else {
      // Complete onboarding
      toast({ title: "Welcome to GigBox!" });
      navigate("/dashboard");
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  const progress = (step / totalSteps) * 100;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
            <span className="font-bold text-xl">GigBox SL</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="container py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 container py-6 max-w-lg">
        {step === 1 && (
          <Card className="glass-card p-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Where are you located?</h1>
              <p className="text-muted-foreground mt-1">
                This helps us show you relevant gigs nearby
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>City *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+232 XX XXX XXXX"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Address (Optional)</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address..."
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass-card p-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Add your photo</h1>
              <p className="text-muted-foreground mt-1">
                Help employers and workers recognize you
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {profile.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-3">
                <Button variant="outline" asChild disabled={uploading}>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                You can skip this step and add a photo later from your profile
              </p>
            </div>
          </Card>
        )}

        {step === 3 && profile.role === "worker" && (
          <Card className="glass-card p-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">What are your skills?</h1>
              <p className="text-muted-foreground mt-1">
                Select skills that match your experience
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add a custom skill..."
                  onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                />
                <Button onClick={addCustomSkill} disabled={!customSkill.trim()}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
                {skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSkill(skill.id)}
                  >
                    {skill.name}
                    {selectedSkills.includes(skill.id) && (
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>

              {selectedSkills.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </Card>
        )}

        {((step === 3 && profile.role === "employer") || step === 4) && (
          <Card className="glass-card p-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold">You're all set!</h1>
              <p className="text-muted-foreground mt-1">
                Your profile is ready. Start{" "}
                {profile.role === "employer" ? "posting gigs" : "finding work"} today!
              </p>

              <div className="mt-8 p-4 bg-muted/50 rounded-xl text-left">
                <h3 className="font-semibold mb-2">What's next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {profile.role === "employer" ? (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Post your first gig
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Review applications from workers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Hire and manage your workforce
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Explore available gigs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Apply to jobs that match your skills
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Complete verification for better opportunities
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-border bg-card/50 backdrop-blur">
        <div className="container py-4 max-w-lg flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleNext} disabled={loading}>
            {step === totalSteps ? (
              <>
                Get Started
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
