import { Home, Search, Briefcase, User, Bell } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Briefcase, label: "Jobs", path: "/my-jobs" },
  { icon: Bell, label: "Alerts", path: "/notifications" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "mobile-nav-item flex-1",
                isActive && "mobile-nav-item-active"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
