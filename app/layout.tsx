import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ErrorBoundary from "@/components/shared/error-boundary"
import { AuthProvider } from "@/hooks/use-auth.tsx"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "User Engagement Dashboard",
  description: "Monitor user activity and identify at-risk users for early intervention",
    generator: 'v0.dev'
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}
