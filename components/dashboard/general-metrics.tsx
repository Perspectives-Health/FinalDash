"use client"

import { TrendingUp, Calendar, Clock, Users } from "lucide-react"

interface GeneralMetricsProps {
  avgSessionsPerDay: number
  avgSessionsPerWeek: number
  avgSessionsPerMonth: number
  stickiness: number
  loading?: boolean
}

export default function GeneralMetrics({ 
  avgSessionsPerDay, 
  avgSessionsPerWeek, 
  avgSessionsPerMonth, 
  stickiness, 
  loading = false 
}: GeneralMetricsProps) {
  const metrics = [
    {
      title: "Avg Sessions/Day",
      value: avgSessionsPerDay,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Avg Sessions/Week", 
      value: avgSessionsPerWeek,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Avg Sessions/Month",
      value: avgSessionsPerMonth,
      icon: Clock,
      color: "text-purple-600", 
      bgColor: "bg-purple-50"
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">General Metrics</h3>
          <div className="text-sm text-gray-500">Loading metrics...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-[170px] flex flex-col ">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">General Metrics</h3>
        <div className="text-sm text-gray-500">Across all centers</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
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
  )
}
