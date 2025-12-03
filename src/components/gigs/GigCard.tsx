import { MapPin, Clock, DollarSign, Users, CheckCircle2, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Gig } from "@/types/database";
import { cn } from "@/lib/utils";

interface GigCardProps {
  gig: Gig;
  variant?: "default" | "compact" | "featured";
}

export function GigCard({ gig, variant = "default" }: GigCardProps) {
  const formatPay = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusColors: Record<string, string> = {
    posted: "bg-success/10 text-success",
    in_progress: "bg-primary/10 text-primary",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  if (variant === "compact") {
    return (
      <Link to={`/gigs/${gig.id}`}>
        <Card className="p-4 card-hover glass-card">
          <div className="flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{gig.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{gig.city}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-primary">{formatPay(gig.pay_amount)}</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {gig.delivery_type}
              </Badge>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/gigs/${gig.id}`}>
      <Card className={cn(
        "overflow-hidden card-hover glass-card",
        variant === "featured" && "border-primary/20"
      )}>
        {variant === "featured" && (
          <div className="bg-gradient-to-r from-primary to-primary-glow px-4 py-1.5">
            <span className="text-xs font-medium text-primary-foreground">Featured Gig</span>
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusColors[gig.status] || "bg-muted text-muted-foreground"}>
                  {gig.status.replace("_", " ")}
                </Badge>
                {gig.delivery_type === "remote" && (
                  <Badge variant="outline" className="text-xs">Remote</Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{gig.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {gig.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-primary">{formatPay(gig.pay_amount)}</p>
              <p className="text-xs text-muted-foreground">{gig.payment_method}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{gig.city}</span>
            </div>
            {gig.duration_hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{gig.duration_hours}h</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{gig.max_applicants} spots</span>
            </div>
          </div>

          {gig.tags && gig.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {gig.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {gig.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{gig.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            {gig.employer?.profile ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={gig.employer.profile.profile_photo_url || undefined} />
                  <AvatarFallback className="bg-muted text-xs">
                    {gig.employer.profile.full_name?.[0] || "E"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{gig.employer.org_name || gig.employer.profile.full_name}</p>
                  {gig.employer.verification_level && gig.employer.verification_level > 1 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div />
            )}
            <Button size="sm">Apply Now</Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
