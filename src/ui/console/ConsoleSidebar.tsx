"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Home, Settings, Target } from "lucide-react";
import { Card } from "@/ui/primitives/card";
import { cn } from "@/lib/utils";
import { can, type Action, type Subject } from "@/lib/rbac";
import { useSessionStore } from "@/stores/session.store";

type NavItem = {
  label: string;
  href: string;
  action: Action;
  subject: Subject;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/console", action: "manage", subject: "campaign", icon: Home },
  { label: "Gestion", href: "/console/campaigns", action: "manage", subject: "campaign", icon: Target },
];

const configItems: NavItem[] = [
  { label: "Configuracion", href: "/console/admin", action: "admin", subject: "admin", icon: Settings },
];

export const ConsoleSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const role = useSessionStore((state) => state.currentRole);
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) =>
    can(item.action, item.subject, role),
  );
  const visibleConfigItems = configItems.filter((item) =>
    can(item.action, item.subject, role),
  );

  return (
    <aside className="border-r border-border/60 bg-card/20 px-3 py-5">
      <Card className="panel fade-rise h-full p-3">
        <div
          className={cn(
            "flex items-center gap-2 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <span className={cn(collapsed && "sr-only")}>Navegacion</span>
          <div className={cn("h-1 w-6 rounded-full bg-primary/50", collapsed && "w-3")} />
        </div>
        <nav className="mt-4 flex h-full flex-col">
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const isRootConsole = item.href === "/console";
              const isActive = isRootConsole
                ? pathname === "/console"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-auto space-y-1 pt-4">
            {visibleConfigItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </Card>
    </aside>
  );
};
