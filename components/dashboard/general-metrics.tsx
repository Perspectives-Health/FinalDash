"use client"

import { TrendingUp, Calendar, Clock, Users, User, Activity } from "lucide-react"

interface GeneralMetricsProps {
  avgSessionsPerDay: number
  avgSessionsPerWeek: number
  avgSessionsPerMonth: number
  stickiness: number
  avgSessionsPerUserPerDay: number
  avgSessionsPerUserPerWeek: number
  avgSessionsPerUserPerMonth: number
  avgSessionsPerWeekday: number
  avgSessionsPerUserPerWeekday: number
  avgSessionsPerWeekend: number
  avgSessionsPerUserPerWeekend: number
  loading?: boolean
}

export default function GeneralMetrics({ 
  avgSessionsPerDay, 
  avgSessionsPerWeek, 
  avgSessionsPerMonth, 
  stickiness, 
  avgSessionsPerUserPerDay,
  avgSessionsPerUserPerWeek,
  avgSessionsPerUserPerMonth,
  avgSessionsPerWeekday,
  avgSessionsPerUserPerWeekday,
  avgSessionsPerWeekend,
  avgSessionsPerUserPerWeekend,
  loading = false 
}: GeneralMetricsProps) {
  const systemMetrics = [
    {
      title: "System Sessions/Day",
      value: avgSessionsPerDay,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      suffix: ""
    },
    {
      title: "System Sessions/Week", 
      value: avgSessionsPerWeek,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      suffix: ""
    },
    {
      title: "System Sessions/Month",
      value: avgSessionsPerMonth,
      icon: Clock,
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      suffix: ""
    },
    {
      title: "Stickiness",
      value: stickiness,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      suffix: "%"
    }
  ]

  const userMetrics = [
    {
      title: "Per User/Day",
      value: avgSessionsPerUserPerDay,
      icon: User,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      suffix: ""
    },
    {
      title: "Per User/Week", 
      value: avgSessionsPerUserPerWeek,
      icon: Activity,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      suffix: ""
    },
    {
      title: "Per User/Month",
      value: avgSessionsPerUserPerMonth,
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      suffix: ""
    }
  ]

  const weekdayMetrics = [
    {
      title: "Weekday Sessions",
      value: avgSessionsPerWeekday,
      icon: Calendar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      suffix: ""
    },
    {
      title: "Per User/Weekday",
      value: avgSessionsPerUserPerWeekday,
      icon: User,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      suffix: ""
    }
  ]

  const weekendMetrics = [
    {
      title: "Weekend Sessions",
      value: avgSessionsPerWeekend,
      icon: Calendar,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      suffix: ""
    },
    {
      title: "Per User/Weekend",
      value: avgSessionsPerUserPerWeekend,
      icon: User,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      suffix: ""
    }
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">General Metrics</h3>
          <div className="text-sm text-gray-500">Loading metrics...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">General Metrics</h3>
        <div className="text-sm text-gray-500">System-wide & per-user metrics</div>
      </div>
      
      {/* System-wide metrics */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">System Activity</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div key={index} className={`text-center p-4 ${metric.bgColor} rounded-lg border border-gray-100`}>
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`w-5 h-5 ${metric.color} mr-2`} />
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value.toFixed(2)}{metric.suffix || ""}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{metric.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-user metrics */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Per-User Engagement</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div key={index} className={`text-center p-4 ${metric.bgColor} rounded-lg border border-gray-100`}>
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`w-5 h-5 ${metric.color} mr-2`} />
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value.toFixed(2)}{metric.suffix || ""}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{metric.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekday metrics */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Weekday Activity (Mon-Fri)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weekdayMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div key={index} className={`text-center p-4 ${metric.bgColor} rounded-lg border border-gray-100`}>
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`w-5 h-5 ${metric.color} mr-2`} />
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value.toFixed(2)}{metric.suffix || ""}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{metric.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekend metrics */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Weekend Activity (Sat-Sun)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weekendMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div key={index} className={`text-center p-4 ${metric.bgColor} rounded-lg border border-gray-100`}>
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`w-5 h-5 ${metric.color} mr-2`} />
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value.toFixed(2)}{metric.suffix || ""}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{metric.title}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
