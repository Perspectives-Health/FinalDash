"use client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { TrendingUp } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface TrendChartProps {
  data: Array<{
    date: string
    value: number
    emails?: string[]
  }>
  title: string
  color?: string
  height?: number
  usersToday?: number
  sessionsToday?: number
  usersChange?: {
    value: number
    direction: "up" | "down"
  }
  sessionsChange?: {
    value: number
    direction: "up" | "down"
  }
}

export default function TrendChart({ 
  data, 
  title, 
  color = "#3b82f6", 
  height = 350,
  usersToday,
  sessionsToday,
  usersChange,
  sessionsChange
}: TrendChartProps) {
  
  const fillMissingDates = (data: Array<{ date: string; value: number; emails?: string[] }>) => {
    if (data.length === 0) return []
    
    const currentYear = new Date().getFullYear()
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(`${currentYear}-${a.date}`)
      const dateB = new Date(`${currentYear}-${b.date}`)
      return dateA.getTime() - dateB.getTime()
    })
    
    const startDate = new Date(`${currentYear}-${sortedData[0].date}`)
    const endDate = new Date()
    
    const filledData = []
    const dataMap = new Map(sortedData.map(item => [item.date, item]))
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${month}-${day}`
      
      if (dataMap.has(dateStr)) {
        filledData.push(dataMap.get(dateStr)!)
      } else {
        filledData.push({ date: dateStr, value: 0, emails: [] })
      }
    }
    return filledData
  }

  const filledData = fillMissingDates(data)
  
  const chartData = {
    labels: filledData.map((item) => {
      const date = new Date(item.date)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        label: "Daily Active Users",
        data: filledData.map((item) => item.value),
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return `${context[0].label}`
          },
          label: (context: any) => {
            const dataIndex = context.dataIndex
            const emails = filledData[dataIndex]?.emails || []
            return [
              `${context.parsed.y} active users`,
              ...emails.slice(0, 3).map((email) => `• ${email}`),
              ...(emails.length > 3 ? [`... and ${emails.length - 3} more`] : []),
            ]
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: "#6b7280",
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
          drawBorder: false,
        },
        ticks: {
          precision: 0,
          color: "#6b7280",
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  const totalUsers = filledData.reduce((sum, item) => sum + item.value, 0)
  const avgUsers = Math.round(totalUsers / filledData.length)
  const trend = filledData.length > 1
  ? filledData[filledData.length - 1].value - filledData[filledData.length - 2].value
  : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-8 text-sm">
          <div className="text-center">
            <p className="text-black font-bold text-2xl leading-tight">
              DAU: {usersToday ?? (filledData[filledData.length - 1]?.value ?? 0)}
              {usersChange && (
                <span className={`text-lg ml-2 ${usersChange.direction === "up" ? "text-green-600" : "text-red-600"}`}>
                  {usersChange.direction === "up" ? "↑" : "↓"}{Math.abs(usersChange.value)}
                </span>
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-black font-bold text-2xl leading-tight">
              Sessions: {sessionsToday ?? 0}
              {sessionsChange && (
                <span className={`text-lg ml-2 ${sessionsChange.direction === "up" ? "text-green-600" : "text-red-600"}`}>
                  {sessionsChange.direction === "up" ? "↑" : "↓"}{Math.abs(sessionsChange.value)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
