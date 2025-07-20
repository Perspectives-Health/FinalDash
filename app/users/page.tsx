"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { User, Clock, Building } from "lucide-react"
import { api } from "@/services/api"
import UserDetailContent from "@/components/user-detail/user-detail-content"

interface UserData {
  user_id: string
  email: string
  center_name?: string
  last_session_time?: string
}

type SortBy = 'recent_session' | 'center_name'

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('recent_session')
  const [leftPanelWidth, setLeftPanelWidth] = useState(320) // Default 320px instead of 1/3
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [sortBy])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsersWithSessionAndCenter(sortBy)
      setUsers(data)
      
      // Auto-select first user if none selected or if sorting changed
      if (data.length > 0 && (!selectedUser || !data.find(u => u.user_id === selectedUser.user_id))) {
        setSelectedUser(data[0])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (user: UserData) => {
    setSelectedUser(user)
  }

  const formatLastActivity = (lastSessionTime?: string) => {
    if (!lastSessionTime) return 'No sessions'
    
    const sessionDate = new Date(lastSessionTime)
    const now = new Date()
    const diffMs = now.getTime() - sessionDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Less than 1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} day(s) ago`
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const newWidth = e.clientX
    // Constrain width between 250px and 600px
    const constrainedWidth = Math.min(Math.max(newWidth, 250), 600)
    setLeftPanelWidth(constrainedWidth)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <nav className="flex space-x-1">
                <Link 
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/users"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md"
                >
                  Browse Users & Sessions
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)] relative">
        {/* Left Panel - Users List */}
        <div 
          className="bg-white border-r border-gray-200 flex flex-col"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Users ({users.length})
            </h2>
            
            {/* Sort Toggle Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSortBy('recent_session')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                  sortBy === 'recent_session'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4 mr-1" />
                Recent Activity
              </button>
              <button
                onClick={() => setSortBy('center_name')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                  sortBy === 'center_name'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building className="w-4 h-4 mr-1" />
                Center Name
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.user_id}
                onClick={() => handleUserSelect(user)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUser?.user_id === user.user_id ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                    
                    {/* Center Name */}
                    {user.center_name && (
                      <div className="flex items-center mt-1">
                        <Building className="w-3 h-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-600 truncate">
                          {user.center_name}
                        </p>
                      </div>
                    )}
                    
                    {/* Last Activity */}
                    <div className="flex items-center mt-1">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      <p className={`text-xs truncate ${
                        user.last_session_time ? 'text-gray-600' : 'text-gray-400 italic'
                      }`}>
                        {formatLastActivity(user.last_session_time)}
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-400 truncate mt-1">
                      ID: {user.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize relative group ${
            isDragging ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-gray-400 group-hover:opacity-20" />
        </div>

        {/* Right Panel - User Details */}
        <div className="flex-1 bg-gray-50 min-w-0">
          {selectedUser ? (
            <UserDetailContent
              userId={selectedUser.user_id}
              userEmail={selectedUser.email}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
                <p className="text-gray-500">Choose a user from the left panel to view their detailed session history</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}