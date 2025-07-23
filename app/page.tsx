"use client"

import Link from "next/link"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { useMetrics } from "@/hooks/use-metrics"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"

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
  const { metrics, loading, error, refreshMetrics } = useMetrics()

  const { isConnected } = useRealTimeUpdates(refreshMetrics)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={refreshMetrics} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <nav className="flex space-x-1">
                <Link 
                  href="/"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/users"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Browse Users & Sessions
                </Link>
                </nav>
              </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm text-gray-600">{isConnected ? "Live" : "Disconnected"}</span>
              </div>
              {metrics && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">{getCurrentPSTTime()}</p>
                  <p className="text-xs text-gray-400">
                    Metrics from {formatDateLabel(metrics.usersToday?.date || "").toLowerCase()}, User Activity from today
                  </p>
                </div>
              )}
              <button
                onClick={refreshMetrics}
                disabled={loading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        </div>

        <DashboardLayout metrics={metrics} loading={loading} />
      </div>
    </div>
  )
}