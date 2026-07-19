"use client";

import { createContext, useContext } from "react";
import type { SafeUser } from "@/db/schema";

const UserContext = createContext<SafeUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
