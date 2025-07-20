const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/dashboard"

// Debug: Log the API base URL
console.log("API_BASE_URL:", API_BASE_URL)

async function apiRequest(endpoint: string, retries = 3) {
  const fullUrl = `${API_BASE_URL}${endpoint}`
  console.log("Making API request to:", fullUrl)
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      return response.json()
    } catch (error) {
      console.error(`API request failed (attempt ${i + 1}/${retries}):`, error)
      if (i === retries - 1) {
        throw error
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}

export const api = {
  async getUsersToday() {
    return apiRequest("/users-today")
  },

  async getLastUse() {
    return apiRequest("/last-use")
  },

  async getDAU() {
    return apiRequest("/dau")
  },

  async getWeeklyUsers() {
    return apiRequest("/weekly-users")
  },

  async getSessionsTodayByUser() {
    return apiRequest("/sessions-today-by-user")
  },

  async getSessionsToday() {
    return apiRequest("/sessions-today")
  },

  async getAllSessions() {
    return apiRequest("/all-sessions")
  },

  async getUserSessions(userId: string) {
    return apiRequest(`/user-sessions/${userId}`)
  },

  async getAllUsers() {
    return apiRequest("/all-users")
  },

  async getUsersWithSessionAndCenter(sortBy: 'recent_session' | 'center_name' = 'recent_session') {
    return apiRequest(`/users-with-centers?sort_by=${sortBy}`)
  },

  async getHealthCheck() {
    return apiRequest("/health")
  },
}