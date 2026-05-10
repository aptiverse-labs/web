import { RoleGuard } from "@/components/common/RoleGuard";

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="school_admin">{children}</RoleGuard>;
}
