"use client"

import { Calendar, TrendingUp } from "lucide-react"

interface WeeklyHeatMapProps {
  data: Array<{
    week_start: string
    unique_users: number
    user_emails: string[]
    unique_sessions: number
  }>
}

export default function WeeklyHeatMap({ data }: WeeklyHeatMapProps) {
  const recentWeeks = data.slice(0, 4)
  const maxUsers = Math.max(...recentWeeks.map((week) => week.unique_users))

  const getIntensity = (users: number) => {
    if (maxUsers === 0) return 0
    return (users / maxUsers) * 100
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return "bg-blue-600"
    if (intensity >= 60) return "bg-blue-500"
    if (intensity >= 40) return "bg-blue-400"
    if (intensity >= 20) return "bg-blue-300"
    return "bg-blue-200"
  }

  const getWeekLabel = (weekStart: string, index: number) => {
    const date = new Date(weekStart)
    const now = new Date()
    const diffWeeks = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 7))

    if (diffWeeks === 0) return "This Week"
    if (diffWeeks === 1) return "Last Week"
    return `${diffWeeks} weeks ago`
  }

  const getWeekDateRange = (weekStart: string) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const getPercentageChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return currentValue > 0 ? '+∞' : '0'
    const change = ((currentValue - previousValue) / previousValue) * 100
    return change > 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`
  }

  const getTrendIcon = (currentValue: number, previousValue: number) => {
    if (currentValue > previousValue) return '↗'
    if (currentValue < previousValue) return '↘'
    return '→'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-bold text-gray-900">WEEKLY PERFORMANCE</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>4 week trend</span>
        </div>
      </div>

      <div className="space-y-5">
        {recentWeeks.map((week, index) => {
          const intensity = getIntensity(week.unique_users)
          const weekLabel = getWeekLabel(week.week_start, index)
          const dateRange = getWeekDateRange(week.week_start)
          const isCurrentWeek = index === 0
          const previousWeek = recentWeeks[index + 1]
          
          const userChange = previousWeek ? getPercentageChange(week.unique_users, previousWeek.unique_users) : null
          const userTrend = previousWeek ? getTrendIcon(week.unique_users, previousWeek.unique_users) : null

          return (
            <div key={week.week_start} className={`space-y-2 p-3 rounded-lg transition-all ${
              isCurrentWeek ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-sm font-semibold ${
                    isCurrentWeek ? 'text-blue-900' : 'text-gray-700'
                  }`}>{weekLabel}</span>
                  <div className="text-xs text-gray-500 mt-1">{dateRange}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${
                      isCurrentWeek ? 'text-blue-900' : 'text-gray-900'
                    }`}>{week.unique_users}</span>
                    <span className="text-sm text-gray-500">users</span>
                    {userChange && userTrend && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-400">{userTrend}</span>
                        <span className={`text-xs font-medium ${
                          userChange.startsWith('+') ? 'text-green-600' : 
                          userChange.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                        }`}>{userChange}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 flex-1 rounded-sm transition-all duration-300 ${
                      i < (intensity / 8.33) ? getIntensityColor(intensity) : "bg-gray-100"
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{week.unique_sessions} sessions</span>
                <span>{Math.round((week.unique_sessions / week.unique_users) * 10) / 10} avg/user</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">Activity Level:</span>
          <div className="flex items-center space-x-2">
            <span>Low</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-blue-200 rounded-sm" />
              <div className="w-4 h-4 bg-blue-300 rounded-sm" />
              <div className="w-4 h-4 bg-blue-400 rounded-sm" />
              <div className="w-4 h-4 bg-blue-500 rounded-sm" />
              <div className="w-4 h-4 bg-blue-600 rounded-sm" />
            </div>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  )
}
