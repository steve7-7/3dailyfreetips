"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { UserProvider } from "./user-context";
import type { SafeUser } from "@/db/schema";

export function DashboardShell({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <UserProvider user={user}>
      <div className="min-h-screen lg:pl-64">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
