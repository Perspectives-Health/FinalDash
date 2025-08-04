"use client"

import MetricCard from "./metric-card"
import TrendChart from "./trend-chart"
import UserActivityTable from "./user-activity-table"
import AtRiskUsersList from "./at-risk-users-list"
import WeeklyHeatMap from "./weekly-heat-map"
import ClinicalNotesReport from "./clinical-notes-report"
import LoadingSpinner from "@/components/shared/loading-spinner"
import type { MetricsData } from "@/types/metrics"

// Helper function to format dates relative to PST
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

// Check if sessionsTodayByUser data is actually from today
function isSessionDataFromToday(): string {
  // This data comes from get_sessions_today_by_user() which uses NOW() AT TIME ZONE 'America/Los_Angeles'
  // So it's always today's data in PST
  return "TODAY"
}

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

interface DashboardLayoutProps {
  metrics: MetricsData | null
  loading: boolean
  onTimeInfoReady?: (timeInfo: { currentTime: string; metricInfo: string }) => void
}

export default function DashboardLayout({ metrics, loading }: DashboardLayoutProps) {
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  // Calculate changes for metric cards
  const comparisonPeriod = "yesterday"
  
  const usersChange =
    metrics.usersToday && metrics.dau.length > 0
      ? ({
          value: metrics.usersToday.unique_users - (metrics.dau[0]?.unique_users || 0),
          percentage: metrics.dau[0]?.unique_users
            ? Math.round(
                ((metrics.usersToday.unique_users - metrics.dau[0].unique_users) / metrics.dau[0].unique_users) * 100,
              )
            : 0,
          direction: metrics.usersToday.unique_users >= (metrics.dau[0]?.unique_users || 0) ? "up" : "down",
          comparisonPeriod,
        } as const)
      : undefined

  const sessionsChange =
    metrics.usersToday && metrics.dau.length > 0
      ? ({
          value: metrics.usersToday.unique_sessions - (metrics.dau[0]?.unique_sessions || 0),
          percentage: metrics.dau[0]?.unique_sessions
            ? Math.round(
                ((metrics.usersToday.unique_sessions - metrics.dau[0].unique_sessions) /
                  metrics.dau[0].unique_sessions) *
                  100,
              )
            : 0,
          direction: metrics.usersToday.unique_sessions >= (metrics.dau[0]?.unique_sessions || 0) ? "up" : "down",
          comparisonPeriod,
        } as const)
      : undefined


  const atRiskCount = metrics.lastUse.length

  const metricsDateLabel = formatDateLabel(metrics.usersToday?.date || "")
  const sessionDataLabel = isSessionDataFromToday()

  return (
    <div className="dashboard-grid space-y-6">
      {/* Top Row - Critical Metrics */}
      {/* Second Row - Trends */}
      <div className="trends-row grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* DAU Graph and MetricCards (left, spans 2 columns) */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <TrendChart
            data={(() => {
              console.log("Raw DAU data:", metrics.dau)
              const sliced = metrics.dau.slice(0, 30)
              console.log("After slice(0, 30):", sliced)
              const reversed = sliced.reverse()
              console.log("After reverse():", reversed)
              const mapped = reversed.map((item) => {
                console.log("DAU item before mapping:", item)
                return {
                  date: item.date,
                  value: item.unique_users,
                  emails: item.user_emails,
                }
              })
              console.log("Final mapped data for TrendChart:", mapped)
              return mapped
            })()}
            title=""
            color="#3b82f6"
            height={300}
            usersToday={metrics.usersToday?.unique_users || 0}
            sessionsToday={metrics.usersToday?.unique_sessions || 0}
            usersChange={usersChange ? { value: usersChange.value, direction: usersChange.direction } : undefined}
            sessionsChange={sessionsChange ? { value: sessionsChange.value, direction: sessionsChange.direction } : undefined}
          />
          <UserActivityTable 
            data={metrics.sessionsTodayByUser} 
            maxRows={10}
            dateLabel={sessionDataLabel}
          />
        </div>
        {/* At-Risk Users (right) */}
        <AtRiskUsersList users={metrics.lastUse} />
      </div>

      {/* Third Row - Details */}
      <div className="details-row grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* <WeeklyHeatMap data={metrics.weeklyUsers} /> */}
        <ClinicalNotesReport />
      </div>
    </div>
  )
}
