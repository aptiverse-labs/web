"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import LockIcon from "@mui/icons-material/LockOutlined";
import { EmptyState } from "./EmptyState";
import { useRoleStore, type Role } from "@/providers/RoleProvider";
import { homeRouteForRole } from "@/lib/home-route";

export type RoleGuardProps = {
  allow: Role | Role[];
  children: React.ReactNode;
};

// Wraps a section of the app that only specific roles may access. Admins
// and super_admins always pass (so they can shadow / inspect any area).
// Reads the display role from RoleProvider; the demo "Switch role" menu
// still mutates that store directly, so it stays the source for what the
// guard shows.
//
// A freshly-authenticated non-student can be dropped onto the student
// /dashboard before anything knows their role: OAuth signups hand a static
// callbackUrl of "/dashboard", and a paid parent returns through /welcome
// which also lands on "/dashboard". Left alone they hit the "wrong role"
// screen. So when the SESSION (the authoritative role, not the store) says
// the signed-in user does not belong in this area, bounce them to their own
// home instead. Keying the redirect off the session — never the store —
// keeps it race-free: it can't fire on the store's persisted/default
// "student" value, and it leaves the unauthenticated demo switcher alone.
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const role = useRoleStore((s) => s.role);
  const router = useRouter();
  const { data: session, status } = useSession();
  const allowedRoles = Array.isArray(allow) ? allow : [allow];
  const isAdmin = role === "admin" || role === "super_admin";
  const allowed = isAdmin || allowedRoles.includes(role);

  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const sessionAllowed =
    !sessionRole ||
    sessionRole === "admin" ||
    sessionRole === "super_admin" ||
    (allowedRoles as readonly string[]).includes(sessionRole);
  const shouldRedirect = status === "authenticated" && !!sessionRole && !sessionAllowed;

  useEffect(() => {
    if (shouldRedirect && sessionRole) {
      router.replace(homeRouteForRole(sessionRole));
    }
  }, [shouldRedirect, sessionRole, router]);

  // An authenticated user in the wrong area is on their way out — show a calm
  // spinner rather than the "wrong role" screen we are about to leave, and
  // never flash the guarded content at them.
  if (shouldRedirect) {
    return (
      <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (allowed) return <>{children}</>;

  return (
    <Box sx={{ py: 6 }}>
      <EmptyState
        icon={<LockIcon />}
        title="Wrong role for this area"
        description={`This dashboard is for ${allowedRoles
          .map((r) => r.replace("_", " "))
          .join(" / ")}. Switch role in the top bar, or head back to your own dashboard.`}
        action={
          <Button component={Link} href={homeRouteForRole(role)} variant="contained">
            Go to my dashboard
          </Button>
        }
      />
    </Box>
  );
}
