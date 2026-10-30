import { AuthGate } from "@/features/auth/components/auth-gate"
import { SettingsButton } from "@/features/preferences/components/settings-button"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate require="guest">
      <main className="relative flex min-h-svh items-center justify-center bg-muted/40 p-6">
        <div className="absolute top-4 right-4">
          <SettingsButton />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </AuthGate>
  )
}
