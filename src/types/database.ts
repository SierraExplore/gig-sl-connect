export type UserRole = "worker" | "employer" | "admin";
export type OrgType = "individual" | "sme" | "ngo" | "government";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type GigStatus = "draft" | "posted" | "matched" | "in_progress" | "verification_pending" | "completed" | "disputed" | "cancelled";
export type DeliveryType = "onsite" | "remote";
export type ProofType = "photo" | "qr" | "physical";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type JobInstanceStatus = "scheduled" | "in_progress" | "verification_pending" | "completed" | "disputed" | "cancelled";
export type VerificationMode = "upload_proof" | "qr_confirmation";
export type DisputeStatus = "open" | "under_review" | "resolved" | "closed";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  nin_encrypted: string | null;
  city: string | null;
  address: string | null;
  coords: { lat: number; lng: number } | null;
  profile_photo_url: string | null;
  verification_status: VerificationStatus;
  nin_image_url: string | null;
  selfie_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface Employer {
  id: string;
  user_id: string;
  org_name: string | null;
  org_type: OrgType;
  registration_docs: string[] | null;
  verification_level: number;
  created_at: string;
  updated_at: string;
}

export interface GigCategory {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Gig {
  id: string;
  gig_id: string;
  employer_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  subcategory: string | null;
  pay_amount: number;
  payment_method: string;
  city: string;
  coords: { lat: number; lng: number } | null;
  full_address: string | null;
  delivery_type: DeliveryType;
  proof_required: ProofType;
  start_time: string | null;
  duration_hours: number | null;
  max_applicants: number;
  tags: string[] | null;
  skill_requirements: string[] | null;
  attachments: string[] | null;
  status: GigStatus;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employer?: Employer & { profile?: Profile };
  category?: GigCategory;
}

export interface Application {
  id: string;
  gig_id: string;
  worker_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  // Joined
  gig?: Gig;
  worker?: Profile;
}

export interface JobInstance {
  id: string;
  gig_id: string;
  worker_id: string;
  start_at: string | null;
  end_at: string | null;
  live_location_allowed: boolean;
  current_location: { lat: number; lng: number } | null;
  verification_mode: VerificationMode;
  qr_token: string | null;
  qr_expires_at: string | null;
  status: JobInstanceStatus;
  employer_confirmed_payment: boolean;
  worker_confirmed_payment: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  gig?: Gig;
  worker?: Profile;
}

export interface Rating {
  id: string;
  job_instance_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  review: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface Dispute {
  id: string;
  job_instance_id: string;
  initiator_id: string;
  reason: string;
  evidence: string[] | null;
  status: DisputeStatus;
  admin_decision: string | null;
  admin_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
