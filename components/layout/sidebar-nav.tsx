"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Wind,
  ShieldCheck,
  LayoutTemplate,
  Users,
  FileLock2,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    heading: "Access Control",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Sites", href: "/sites", icon: MapPin },
      { label: "Turbines", href: "/turbines", icon: Wind },
      { label: "Standards", href: "/standards", icon: ShieldCheck },
      { label: "Templates", href: "/templates", icon: LayoutTemplate },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Users", href: "/users", icon: Users },
      { label: "AWPs", href: "/awps", icon: FileLock2 },
      { label: "Audit Log", href: "/audit-log", icon: ScrollText },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 px-3">
      {sections.map((section) => (
        <div key={section.heading} className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.heading}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
