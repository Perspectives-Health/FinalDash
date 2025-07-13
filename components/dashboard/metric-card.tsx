"use client"

import { ArrowUp, ArrowDown } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number | string
  change?: {
    value: number
    percentage: number
    direction: "up" | "down"
    comparisonPeriod?: string
  }
  status?: "success" | "warning" | "danger" | "info"
  subtitle?: string
  onClick?: () => void
}

export default function MetricCard({ title, value, change, status = "info", subtitle, onClick }: MetricCardProps) {
  const isAtRisk = title.includes("AT-RISK")

  const cardColors = {
    success: "bg-white border-green-200 hover:border-green-300",
    warning: "bg-white border-yellow-200 hover:border-yellow-300",
    danger: isAtRisk ? "bg-red-500 text-white border-red-600" : "bg-white border-red-200 hover:border-red-300",
    info: "bg-white border-gray-200 hover:border-gray-300",
  }

  const numberColors = {
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: isAtRisk ? "text-white" : "text-red-600",
    info: "text-gray-900",
  }

  const changeColors = {
    up: "text-green-600",
    down: "text-red-600",
  }

  return (
    <div
      className={`${cardColors[status]} rounded-xl border-2 p-4 shadow-sm transition-all duration-200 min-h-[60px]${
        onClick ? " cursor-pointer hover:shadow-lg transform hover:scale-[1.02]" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${isAtRisk ? "text-red-100" : "text-gray-600"}`}
            >
              {title}
            </p>
            {subtitle && <p className={`text-base mt-3 ${isAtRisk ? "text-red-200" : "text-gray-500"}`}>{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-end justify-between flex-1">
          <div className="flex items-baseline">
            <p className={`text-4xl font-bold ${numberColors[status]} leading-none`}>{value}</p>
          </div>

          {change && (
            <div
              className={`flex items-center text-base font-medium ${isAtRisk ? "text-red-100" : changeColors[change.direction]}`}
            >
              <div className="text-right">
                <div>
                  {change.direction === "up" ? "+" : ""}
                  {change.value} vs {change.comparisonPeriod || "yesterday"}
                </div>
                <div className="text-base">
                  ({change.direction === "up" ? "+" : ""}
                  {change.percentage}%)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
