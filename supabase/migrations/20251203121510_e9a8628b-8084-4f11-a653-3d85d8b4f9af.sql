-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.user_role AS ENUM ('worker', 'employer', 'admin');
CREATE TYPE public.org_type AS ENUM ('individual', 'sme', 'ngo', 'government');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.gig_status AS ENUM ('draft', 'posted', 'matched', 'in_progress', 'verification_pending', 'completed', 'disputed', 'cancelled');
CREATE TYPE public.delivery_type AS ENUM ('onsite', 'remote');
CREATE TYPE public.proof_type AS ENUM ('photo', 'qr', 'physical');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE public.job_instance_status AS ENUM ('scheduled', 'in_progress', 'verification_pending', 'completed', 'disputed', 'cancelled');
CREATE TYPE public.verification_mode AS ENUM ('upload_proof', 'qr_confirmation');
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'worker',
  nin_encrypted TEXT,
  city TEXT,
  address TEXT,
  coords JSONB,
  profile_photo_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  nin_image_url TEXT,
  selfie_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skills junction table
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  level TEXT DEFAULT 'intermediate',
  UNIQUE(user_id, skill_id)
);

-- Employers table (additional info for employer profiles)
CREATE TABLE public.employers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  org_name TEXT,
  org_type org_type DEFAULT 'individual',
  registration_docs TEXT[],
  verification_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gig categories
CREATE TABLE public.gig_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gigs table
CREATE TABLE public.gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id TEXT UNIQUE NOT NULL,
  employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.gig_categories(id),
  subcategory TEXT,
  pay_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'mobile_money',
  city TEXT NOT NULL,
  coords JSONB,
  full_address TEXT,
  delivery_type delivery_type DEFAULT 'onsite',
  proof_required proof_type DEFAULT 'photo',
  start_time TIMESTAMPTZ,
  duration_hours INTEGER,
  max_applicants INTEGER DEFAULT 10,
  tags TEXT[],
  skill_requirements TEXT[],
  attachments TEXT[],
  status gig_status DEFAULT 'draft',
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'pending',
  cover_letter TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gig_id, worker_id)
);

-- Job instances (when a worker is assigned to a gig)
CREATE TABLE public.job_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  live_location_allowed BOOLEAN DEFAULT false,
  current_location JSONB,
  verification_mode verification_mode DEFAULT 'upload_proof',
  qr_token TEXT,
  qr_expires_at TIMESTAMPTZ,
  status job_instance_status DEFAULT 'scheduled',
  employer_confirmed_payment BOOLEAN DEFAULT false,
  worker_confirmed_payment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification logs (immutable)
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_instance_id UUID REFERENCES public.job_instances(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL,
  media_url TEXT,
  qr_scanned BOOLEAN DEFAULT false,
  gps JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_instance_id UUID REFERENCES public.job_instances(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.profiles(id) NOT NULL,
  rated_id UUID REFERENCES public.profiles(id) NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_instance_id, rater_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_instance_id UUID REFERENCES public.job_instances(id) ON DELETE CASCADE NOT NULL,
  initiator_id UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT[],
  status dispute_status DEFAULT 'open',
  admin_decision TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles for RBAC (separate from profile role for admin capabilities)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to generate gig ID
CREATE OR REPLACE FUNCTION public.generate_gig_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(gig_id FROM 8) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.gigs;
  
  NEW.gig_id := 'GIG-SL-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_gig_id
  BEFORE INSERT ON public.gigs
  FOR EACH ROW
  WHEN (NEW.gig_id IS NULL)
  EXECUTE FUNCTION public.generate_gig_id();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON public.employers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_job_instances_updated_at BEFORE UPDATE ON public.job_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Skills: public read
CREATE POLICY "Skills viewable by everyone" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage skills" ON public.skills FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User skills
CREATE POLICY "User skills viewable by everyone" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- Employers
CREATE POLICY "Employers viewable by everyone" ON public.employers FOR SELECT USING (true);
CREATE POLICY "Users can manage own employer profile" ON public.employers FOR ALL USING (auth.uid() = user_id);

-- Gig categories: public read
CREATE POLICY "Categories viewable by everyone" ON public.gig_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.gig_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Gigs
CREATE POLICY "Posted gigs viewable by everyone" ON public.gigs FOR SELECT USING (status != 'draft' OR employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid()));
CREATE POLICY "Employers can create gigs" ON public.gigs FOR INSERT WITH CHECK (employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid()));
CREATE POLICY "Employers can update own gigs" ON public.gigs FOR UPDATE USING (employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all gigs" ON public.gigs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE POLICY "Workers can view own applications" ON public.applications FOR SELECT USING (worker_id = auth.uid() OR gig_id IN (SELECT id FROM public.gigs WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())));
CREATE POLICY "Workers can create applications" ON public.applications FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Users can update own applications" ON public.applications FOR UPDATE USING (worker_id = auth.uid() OR gig_id IN (SELECT id FROM public.gigs WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())));

-- Job instances
CREATE POLICY "Involved parties can view job instances" ON public.job_instances FOR SELECT USING (worker_id = auth.uid() OR gig_id IN (SELECT id FROM public.gigs WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employers can create job instances" ON public.job_instances FOR INSERT WITH CHECK (gig_id IN (SELECT id FROM public.gigs WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())));
CREATE POLICY "Involved parties can update job instances" ON public.job_instances FOR UPDATE USING (worker_id = auth.uid() OR gig_id IN (SELECT id FROM public.gigs WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())));

-- Verification logs
CREATE POLICY "Involved parties can view verification logs" ON public.verification_logs FOR SELECT USING (job_instance_id IN (SELECT id FROM public.job_instances WHERE worker_id = auth.uid()) OR job_instance_id IN (SELECT ji.id FROM public.job_instances ji JOIN public.gigs g ON ji.gig_id = g.id JOIN public.employers e ON g.employer_id = e.id WHERE e.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Involved parties can create verification logs" ON public.verification_logs FOR INSERT WITH CHECK (actor_id = auth.uid());

-- Ratings
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON public.ratings FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Disputes
CREATE POLICY "Involved parties can view disputes" ON public.disputes FOR SELECT USING (initiator_id = auth.uid() OR job_instance_id IN (SELECT id FROM public.job_instances WHERE worker_id = auth.uid()) OR job_instance_id IN (SELECT ji.id FROM public.job_instances ji JOIN public.gigs g ON ji.gig_id = g.id JOIN public.employers e ON g.employer_id = e.id WHERE e.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT WITH CHECK (initiator_id = auth.uid());
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Audit logs: admin only
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- User roles: admin only
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.gigs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_logs;

-- Seed initial data
INSERT INTO public.gig_categories (name, icon) VALUES
  ('Delivery & Logistics', '🚚'),
  ('Home Services', '🏠'),
  ('Digital & Tech', '💻'),
  ('Events & Hospitality', '🎉'),
  ('Retail & Sales', '🛒'),
  ('Education & Tutoring', '📚'),
  ('Healthcare & Wellness', '🏥'),
  ('Construction & Labor', '🔨'),
  ('Agriculture', '🌾'),
  ('Creative & Media', '🎨');

INSERT INTO public.skills (name, category) VALUES
  ('Driving', 'Transport'),
  ('Motorcycle Riding', 'Transport'),
  ('Cooking', 'Hospitality'),
  ('Cleaning', 'Home Services'),
  ('Gardening', 'Home Services'),
  ('Plumbing', 'Construction'),
  ('Electrical Work', 'Construction'),
  ('Carpentry', 'Construction'),
  ('Web Development', 'Tech'),
  ('Mobile App Development', 'Tech'),
  ('Graphic Design', 'Creative'),
  ('Photography', 'Creative'),
  ('Video Editing', 'Creative'),
  ('Teaching', 'Education'),
  ('Tutoring', 'Education'),
  ('Customer Service', 'Retail'),
  ('Sales', 'Retail'),
  ('Data Entry', 'Admin'),
  ('Translation', 'Language'),
  ('Security', 'Security');