import { RoleGuard } from "@/components/common/RoleGuard";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="parent">{children}</RoleGuard>;
}
