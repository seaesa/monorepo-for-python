import { SettingsButton } from "@/features/preferences/components/settings-button"

/** Centered shell shared by every auth screen (guest pages and the verify page). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="absolute top-4 right-4">
        <SettingsButton />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
