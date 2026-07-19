"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Goal,
  CreditCard,
  User as UserIcon,
  Crown,
  X,
  LogOut,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useUser } from "./user-context";
import { toast } from "./toaster";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/predictions", label: "Predictions", icon: Goal },
  { href: "/dashboard/tester", label: "Speed & Preview", icon: Zap },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.info("You've been signed out.");
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
    >
      <LogOut className="h-5 w-5" />
      Sign out
    </button>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const user = useUser();
  const isPremium = user?.plan === "premium";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Goal<span className="text-emerald-400">Edge</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-emerald-500/15 text-white ring-1 ring-inset ring-emerald-500/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-emerald-400" : "text-slate-400",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!isPremium && (
          <div className="px-3 pb-3">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/10 p-4 ring-1 ring-inset ring-white/10">
              <div className="flex items-center gap-2 text-emerald-300">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Go Premium
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Unlock high-value tips, in-depth analysis & accumulator slips.
              </p>
              <Link
                href="/dashboard/subscription"
                onClick={onClose}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
              >
                Upgrade now
              </Link>
            </div>
          </div>
        )}

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white/10"
              style={{ backgroundColor: user?.avatarColor ?? "#10b981" }}
            >
              {initials(user?.name ?? "U")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
