"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, BarChart3 } from "lucide-react"

interface UserActivityTableProps {
  data: Array<{
    user_id: string
    email: string
    total_sessions: number
    latest_pacific_time: string
  }>
  maxRows?: number
  dateLabel?: string
}

export default function UserActivityTable({ data, maxRows = 10, dateLabel = "TODAY" }: UserActivityTableProps) {
  const [showAll, setShowAll] = useState(false)
  const router = useRouter()

  // Use real data from the API
  const dataToUse = data
  const sortedData = [...dataToUse].sort((a, b) => b.total_sessions - a.total_sessions)
  const displayData = showAll ? sortedData : sortedData.slice(0, maxRows)
  const maxSessions = Math.max(...dataToUse.map((item) => item.total_sessions))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[400px] py-2">
      <div className="flex items-center justify-between h-16 p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 h-full">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900 h-full flex items-center">{dateLabel}'S USER ACTIVITY</h3>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{dataToUse.length} active users</span>
      </div>

      <div className="h-[calc(100%-64px)] overflow-y-auto ">
        {displayData.map((user, index) => (
          <div
            key={user.email}
            className="flex items-center justify-between p-4 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200"
            onClick={() => router.push(`/users/${user.user_id}`)}
          >
            <div className="flex items-center flex-1 min-w-0 space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last active: {user.latest_pacific_time}</p>
              </div>
            </div>

            <div className="flex items-center ml-4 space-x-1">
              <div className="text-right">
                <span className="text-lg text-gray-900">{user.total_sessions} sessions</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {data.length > maxRows && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 text-sm text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {showAll ? "Show Less" : `View All ${data.length} Users`}
          </button>
        </div>
      )}
    </div>
  )
}
