import Link from "next/link"

import { AuthGate } from "@/features/auth/components/auth-gate"
import { UserMenu } from "@/features/auth/components/user-menu"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate require="auth">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/todos" className="font-semibold">
            Todos
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </AuthGate>
  )
}
