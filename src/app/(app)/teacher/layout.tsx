import { RoleGuard } from "@/components/common/RoleGuard";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="teacher">{children}</RoleGuard>;
}
