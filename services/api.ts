const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

async function apiRequest(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }
  return response.json()
}

export const api = {
  async getUsersToday() {
    return apiRequest("/metrics/users-today")
  },

  async getLastUse() {
    return apiRequest("/users/last-use")
  },

  async getDAU() {
    return apiRequest("/metrics/dau")
  },

  async getWeeklyUsers() {
    return apiRequest("/metrics/weekly")
  },

  async getSessionsTodayByUser() {
    return apiRequest("/sessions/today/by-user")
  },

  async getSessionsToday() {
    return apiRequest("/sessions/today")
  },

  async getAllSessions() {
    return apiRequest("/sessions/")
  },

  async getUserSessions(userId: string) {
    return apiRequest(`/users/${userId}/sessions`)
  },

  async getAllUsers() {
    return apiRequest("/users")
  },

  async getUsersWithSessionAndCenter(sortBy: 'recent_session' | 'center_name' = 'recent_session') {
    return apiRequest(`/users/with-session-and-center?sort_by=${sortBy}`)
  },
}