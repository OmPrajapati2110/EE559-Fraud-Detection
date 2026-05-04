import { useAuthStore } from '@/store/authStore';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuthStore();
  if (!isAdmin) return null;
  return <>{children}</>;
}
