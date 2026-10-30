import { AuthGate } from "@/features/auth/components/auth-gate"
import { AuthShell } from "@/features/auth/components/auth-shell"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate require="guest">
      <AuthShell>{children}</AuthShell>
    </AuthGate>
  )
}
