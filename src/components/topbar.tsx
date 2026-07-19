"use client";

import Link from "next/link";
import { Menu, Crown, Search, Zap } from "lucide-react";
import { useUser } from "./user-context";
import { Avatar } from "./ui/kit";
import { buttonClasses } from "./ui/button";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useUser();
  const isPremium = user?.plan === "premium";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur lg:pl-64">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Link
              href="/dashboard/predictions"
              className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-400 transition hover:border-slate-300"
            >
              Search predictions, leagues…
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 md:flex-none">
          <Link
            href="/dashboard/tester"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-500" />
            Speed &amp; Cache
          </Link>
          {!isPremium ? (
            <Link
              href="/dashboard/subscription"
              className={buttonClasses("primary", "sm")}
            >
              <Crown className="h-4 w-4" />
              Upgrade
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <Crown className="h-3.5 w-3.5" />
              Premium
            </span>
          )}
          <Link href="/dashboard/profile" aria-label="Profile">
            <Avatar
              name={user?.name ?? "User"}
              color={user?.avatarColor}
              size={38}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
