"use client"

import Link from "next/link"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import LoginForm from "@/components/auth/login-form"
import { DashboardLoadingPage } from "@/components/shared/loading-page"
import { useMetrics } from "@/hooks/use-metrics"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"
import { useAuth } from "@/hooks/use-auth"
import { AuthenticationError } from "@/services/api"
import { useEffect } from "react"

// Helper functions for date/time display
function getCurrentPSTTime(): string {
  const now = new Date()
  return now.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    year: "numeric",
    month: "long", 
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }) + " PST"
}

function formatDateLabel(dataDateStr: string): string {
  if (!dataDateStr) return "TODAY"
  
  const now = new Date()
  const pstNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
  const today = pstNow.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }).replace("/", "-")
  
  const yesterday = new Date(pstNow)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }).replace("/", "-")
  
  if (dataDateStr === today) return "TODAY"
  if (dataDateStr === yesterdayStr) return "YESTERDAY"
  
  // Convert MM-DD to readable format like "Dec 15"
  const [month, day] = dataDateStr.split("-")
  const date = new Date(pstNow.getFullYear(), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const { metrics, loading, error, refreshMetrics } = useMetrics()

  const { isConnected } = useRealTimeUpdates(refreshMetrics)

  // Show loading spinner while checking authentication
  if (authLoading) {
    return <DashboardLoadingPage />
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Handle API errors, including authentication errors
  if (error) {
    const isAuthError = error.includes('Authentication failed') || error.includes('403') || error.includes('401')
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={refreshMetrics} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Retry
            </button>
            {isAuthError && (
              <button onClick={logout} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Login Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout metrics={metrics} loading={loading} />
  )
}