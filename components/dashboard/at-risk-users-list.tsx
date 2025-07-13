"use client"

import { useState } from "react"
import { AlertTriangle, Clock, Eye } from "lucide-react"

interface AtRiskUsersListProps {
  users: Array<{
    email: string
    id: string
    last_use_pacific: string
  }>
  onUserClick: (userId: string, email: string) => void
}

export default function AtRiskUsersList({ users, onUserClick }: AtRiskUsersListProps) {
  const [showAll, setShowAll] = useState(false)

  // Users are already filtered by backend to be >36 hours inactive
  const atRiskUsers = users
    .map((user) => {
      const lastUse = new Date(user.last_use_pacific)
      const hoursSince = Math.floor((Date.now() - lastUse.getTime()) / (1000 * 60 * 60))
      const daysSince = Math.floor(hoursSince / 24)
      return { ...user, daysSince, hoursSince }
    })
    .sort((a, b) => b.hoursSince - a.hoursSince)

  const displayUsers = showAll ? atRiskUsers : atRiskUsers.slice(0, 5)

  const getRiskLevel = (hours: number) => {
    if (hours >= 72)
      return {
        level: "critical",
        color: "text-red-600",
        bgColor: "bg-red-100",
        dotColor: "bg-red-500",
        icon: AlertTriangle,
      }
    if (hours >= 48)
      return {
        level: "high",
        color: "text-red-500",
        bgColor: "bg-red-50",
        dotColor: "bg-red-400",
        icon: AlertTriangle,
      }
    return {
      level: "medium",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      dotColor: "bg-yellow-500",
      icon: Clock,
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">AT-RISK USERS</h3>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Last activity &gt; 36 hours</span>
      </div>

      {atRiskUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">All Users Active!</p>
          <p className="text-sm text-gray-500">No at-risk users found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayUsers.map((user) => {
              const risk = getRiskLevel(user.hoursSince)
              const Icon = risk.icon

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 border ${risk.bgColor} hover:shadow-md`}
                  onClick={() => onUserClick(user.id, user.email)}
                >
                  <div className="flex items-center flex-1 min-w-0 space-x-3">
                    <div className={`w-3 h-3 rounded-full ${risk.dotColor} shadow-sm`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate hover:text-red-600 transition-colors">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Last seen: {new Date(user.last_use_pacific).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center ml-4 space-x-3">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${risk.color}`}>{user.hoursSince} hours ago</span>
                      <p className="text-xs text-gray-500 capitalize">{risk.level} risk</p>
                    </div>
                    <Icon className={`w-5 h-5 ${risk.color}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
