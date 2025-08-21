import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ErrorBoundary from "@/components/shared/error-boundary"
import { AuthProvider } from "@/hooks/use-auth"
import { MainNav } from "@/components/shared/main-nav"

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
          <div className="bg-gray-50 flex flex-col h-screen">
            {/* Header with Navigation */}
            <div className="bg-white border-b border-gray-200 h-24" >
              <div className="mx-auto flex items-center justify-between h-full px-4">
                <MainNav />
                {/* Placeholder for right-side elements like live status, refresh, logout */}
                {/* These elements will be re-added or passed as props if needed on all pages */}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="dashboard-container w-full  mx-auto flex-1">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
