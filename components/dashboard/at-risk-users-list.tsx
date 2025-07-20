"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, Eye } from "lucide-react"
import { api } from "@/services/api"

interface AtRiskUsersListProps {
  users: Array<{
    email: string
    id: string
    last_use_pacific: string
    center_name?: string
  }>
  onUserClick: (userId: string, email: string) => void
}

export default function AtRiskUsersList({ users, onUserClick }: AtRiskUsersListProps) {
  const [showAll, setShowAll] = useState(false)
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const router = useRouter()

  // Users are already filtered by backend to be >36 hours inactive
  const atRiskUsers = users
    .map((user) => {
      // Handle cases where user has never used the product
      if (!user.last_use_pacific || user.last_use_pacific === 'null' || user.last_use_pacific === 'undefined') {
        return { ...user, daysSince: Infinity, hoursSince: Infinity, hasNeverUsed: true }
      }
      
      const lastUse = new Date(user.last_use_pacific)
      // Check if the date is invalid
      if (isNaN(lastUse.getTime())) {
        return { ...user, daysSince: Infinity, hoursSince: Infinity, hasNeverUsed: true }
      }
      
      const hoursSince = Math.floor((Date.now() - lastUse.getTime()) / (1000 * 60 * 60))
      const daysSince = Math.floor(hoursSince / 24)
      return { ...user, daysSince, hoursSince, hasNeverUsed: false }
    })
    .sort((a, b) => {
      // Sort users who never used to the end, others by hoursSince desc
      if (a.hasNeverUsed && !b.hasNeverUsed) return 1
      if (!a.hasNeverUsed && b.hasNeverUsed) return -1
      if (a.hasNeverUsed && b.hasNeverUsed) return 0
      return b.hoursSince - a.hoursSince
    })

  const displayUsers = showAll ? atRiskUsers : atRiskUsers.slice(0, 5)

  const formatLastActivity = (lastSessionTime: string) => {
    const sessionDate = new Date(lastSessionTime)
    const now = new Date()
    const diffMs = now.getTime() - sessionDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Less than 1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const formatHoursAgo = (hours: number, hasNeverUsed: boolean = false) => {
    if (hasNeverUsed) {
      return "Never used"
    }
    if (hours < 24) {
      return `${hours} hours ago`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      if (remainingHours === 0) {
        return `${days} days`
      } else {
        return `${days} days ${remainingHours} hours`
      }
    }
  }

  const handleUserClick = async (user: any) => {
    if (user.hasNeverUsed) {
      // If user has never used the product, redirect to users page without session params
      router.push(`/users`)
      return
    }

    setLoadingUserId(user.id)
    
    try {
      // Fetch user sessions to find the most recent one
      const sessions = await api.getUserSessions(user.id)
      
      if (sessions && sessions.length > 0) {
        // Sort sessions by created_at descending to get the most recent
        const sortedSessions = sessions.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        const mostRecentSession = sortedSessions[0]
        
        // Redirect to users page with session parameters
        router.push(`/users?session_id=${mostRecentSession.session_id}&workflow_id=${mostRecentSession.workflow_id}`)
      } else {
        // No sessions found, redirect to users page without session params
        router.push(`/users`)
      }
    } catch (error) {
      console.error("Error fetching user sessions:", error)
      // On error, still redirect to users page without session params
      router.push(`/users`)
    } finally {
      setLoadingUserId(null)
    }
  }

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
            {displayUsers.map((user: any) => {
              const risk = getRiskLevel(user.hasNeverUsed ? 72 : user.hoursSince) // Default to critical for never used
              const Icon = risk.icon

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 border ${risk.bgColor} hover:shadow-md ${loadingUserId === user.id ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center flex-1 min-w-0 space-x-3">
                    <div className={`w-3 h-3 rounded-full ${risk.dotColor} shadow-sm`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate hover:text-red-600 transition-colors">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Last seen: {user.hasNeverUsed ? "Never" : new Date(user.last_use_pacific).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center ml-4 space-x-3">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${risk.color}`}>{formatHoursAgo(user.hoursSince, user.hasNeverUsed)}</span>
                      <p className="text-xs text-gray-500 capitalize">{risk.level} risk</p>
                    </div>
                    {loadingUserId === user.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600" />
                    ) : (
                      <Icon className={`w-5 h-5 ${risk.color}`} />
                    )}
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