import { useState, useEffect, useRef, useCallback } from "react";
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
  Upload,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

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

  // Watch form values for auto-save
  const watchedValues = form.watch();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchSkills();
  }, [user, navigate]);

  // Auto-save debounce
  useEffect(() => {
    if (!profile || !user) return;
    
    const timeoutId = setTimeout(() => {
      const currentValues = form.getValues();
      const hasChanges = 
        currentValues.full_name !== profile.full_name ||
        currentValues.phone !== (profile.phone || "") ||
        currentValues.city !== (profile.city || "") ||
        currentValues.address !== (profile.address || "");
      
      if (hasChanges && currentValues.full_name.length >= 2) {
        autoSave(currentValues);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [watchedValues]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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

    const { data: allSkills } = await supabase
      .from("skills")
      .select("*")
      .order("name");

    if (allSkills) setSkills(allSkills);

    const { data: userSkillsData } = await supabase
      .from("user_skills")
      .select("*, skill:skills(*)")
      .eq("user_id", user.id);

    if (userSkillsData) setUserSkills(userSkillsData);
  }

  const autoSave = useCallback(async (data: ProfileForm) => {
    if (!user) return;

    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        city: data.city || null,
        address: data.address || null,
      })
      .eq("id", user.id);

    setSaving(false);
    setProfile((prev: any) => ({
      ...prev,
      full_name: data.full_name,
      phone: data.phone || null,
      city: data.city || null,
      address: data.address || null,
    }));
  }, [user]);

  async function onSubmit(data: ProfileForm) {
    await autoSave(data);
    toast({ title: "Profile saved!" });
  }

  async function uploadPhoto(file: File) {
    if (!user) return;

    setUploadingPhoto(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploadingPhoto(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_photo_url: publicUrl })
      .eq("id", user.id);

    setUploadingPhoto(false);

    if (updateError) {
      toast({
        title: "Failed to update profile",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Photo updated!" });
      setProfile((prev: any) => ({ ...prev, profile_photo_url: publicUrl }));
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadPhoto(file);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      setShowCameraDialog(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take a photo",
        variant: "destructive",
      });
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
          uploadPhoto(file);
        }
      }, "image/jpeg", 0.9);
    }

    closeCameraDialog();
  }

  function closeCameraDialog() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraDialog(false);
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

  async function addCustomSkill() {
    if (!user || !customSkill.trim()) return;

    setAddingSkill(true);

    // Check if skill already exists
    const { data: existingSkill } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", customSkill.trim())
      .maybeSingle();

    let skillId: string;

    if (existingSkill) {
      skillId = existingSkill.id;
    } else {
      // Create new skill
      const { data: newSkill, error } = await supabase
        .from("skills")
        .insert({ name: customSkill.trim() })
        .select("id")
        .single();

      if (error || !newSkill) {
        toast({
          title: "Failed to add skill",
          description: error?.message || "Unknown error",
          variant: "destructive",
        });
        setAddingSkill(false);
        return;
      }
      skillId = newSkill.id;
    }

    // Check if user already has this skill
    const hasSkill = userSkills.some((us) => us.skill_id === skillId);
    if (!hasSkill) {
      await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
      });
    }

    setCustomSkill("");
    setAddingSkill(false);
    fetchSkills();
    toast({ title: "Skill added!" });
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Auto-saving...
            </div>
          )}
        </div>

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
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
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
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      disabled={uploadingPhoto}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </Button>
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

                  <p className="text-sm text-muted-foreground">
                    Changes are saved automatically
                  </p>
                </form>
              </Form>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Your Skills</h2>
              <p className="text-muted-foreground mb-6">
                Select skills that match your abilities or add your own.
              </p>

              {/* Custom skill input */}
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Type a skill not in the list..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                />
                <Button
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim() || addingSkill}
                >
                  {addingSkill ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* User's current skills */}
              {userSkills.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">Your selected skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {userSkills.map((us) => (
                      <Badge
                        key={us.id}
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => toggleSkill(us.skill_id)}
                      >
                        {us.skill?.name}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available skills */}
              <p className="text-sm font-medium mb-2">Available skills:</p>
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((skill) => !userSkills.some((us) => us.skill_id === skill.id))
                  .map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="cursor-pointer transition-all hover:bg-primary hover:text-primary-foreground"
                      onClick={() => toggleSkill(skill.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {skill.name}
                    </Badge>
                  ))}
              </div>

              {skills.length === 0 && userSkills.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No skills available. Add your own using the input above.
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
                  <Button variant="outline" size="sm" onClick={startCamera}>
                    Take Photo
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={closeCameraDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeCameraDialog} className="flex-1">
                Cancel
              </Button>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
