import { auth } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENV === 'prod' 
  ? "https://perspectiveshealth.ddns.net" 
  : "http://localhost:5001"
// Debug: Log the API base URL
console.log("API_BASE_URL:", API_BASE_URL)

export class AuthenticationError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

async function apiRequest(endpoint: string, retries = 3) {
  const fullUrl = `${API_BASE_URL}${endpoint}`
  console.log("Making API request to:", fullUrl)
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          auth.clearToken()
          throw new AuthenticationError(`Authentication failed: ${response.status} ${response.statusText}`, response.status)
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      return response.json()
    } catch (error) {
      // Don't retry authentication errors
      if (error instanceof AuthenticationError) {
        throw error
      }
      
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
    return apiRequest("/dashboard/users-today")
  },

  async getLastUse() {
    return apiRequest("/dashboard/last-use")
  },

  async getDAU() {
    return apiRequest("/dashboard/dau")
  },

  async getWeeklyUsers() {
    return apiRequest("/dashboard/weekly-users")
  },

  async getSessionsTodayByUser() {
    return apiRequest("/dashboard/sessions-today-by-user")
  },

  async getSessionsToday() {
    return apiRequest("/dashboard/sessions-today")
  },

  async getAllSessions() {
    return apiRequest("/dashboard/all-sessions")
  },

  async getUserSessions(userId: string) {
    return apiRequest(`/dashboard/user-sessions/${userId}`)
  },

  async getAllUsers() {
    return apiRequest("/dashboard/all-users")
  },

  async getUsersWithSessionAndCenter(sortBy: 'recent_session' | 'center_name' = 'recent_session') {
    return apiRequest(`/dashboard/users-with-centers?sort_by=${sortBy}`)
  },

  async getHealthCheck() {
    return apiRequest("/dashboard/health")
  },

  async retryPopulate(sessionId: string, workflowId: string, userId: string) {
    const fullUrl = `${API_BASE_URL}/retry`
    console.log("Making retry populate request to:", fullUrl)
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify({
        session_id: sessionId,
        workflow_id: workflowId,
        user_id: userId
      })
    })
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        auth.clearToken()
        throw new AuthenticationError(`Authentication failed: ${response.status} ${response.statusText}`, response.status)
      }
      throw new Error(`Retry populate failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },

  async getWorkflowStatus(sessionId: string) {
    const fullUrl = `${API_BASE_URL}/clinical-sessions/${sessionId}/all-status`
    console.log("Making workflow status request to:", fullUrl)
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
    })
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        auth.clearToken()
        throw new AuthenticationError(`Authentication failed: ${response.status} ${response.statusText}`, response.status)
      }
      throw new Error(`Get workflow status failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },

  async testPopulate(sessionId: string, workflowId: string, customProcessedQuestions: Record<string, string>, userId: string) {
    const fullUrl = `${API_BASE_URL}/dashboard/test-populate`
    console.log("🚨 FRONTEND API CALL STARTING")
    console.log("🚨 Making test populate request to:", fullUrl)
    console.log("🚨 API_BASE_URL is:", API_BASE_URL)
    
    const requestBody = {
      session_id: sessionId,
      workflow_id: workflowId,
      custom_processed_questions: customProcessedQuestions,
      user_id: userId
    }
    console.log("🚀 API Request Body:", JSON.stringify(requestBody, null, 2))
    
    console.log("🚨 About to make fetch call...")
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(requestBody)
    })
    console.log("🚨 Fetch call completed, response status:", response.status)
    console.log("🚨 Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      console.log("🚨 Response not OK, status:", response.status, response.statusText)
      if (response.status === 401 || response.status === 403) {
        console.log("🚨 Auth error detected, but NOT clearing token to prevent refresh")
        // auth.clearToken()  // TEMPORARILY DISABLED
        throw new AuthenticationError(`Authentication failed: ${response.status} ${response.statusText}`, response.status)
      }
      throw new Error(`Test populate failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },

  async saveQuestions(workflowId: string, newProcessedQuestions: Record<string, string>) {
    const fullUrl = `${API_BASE_URL}/dashboard/save-questions`
    console.log("Making save questions request to:", fullUrl)
    
    const requestBody = {
      workflow_id: workflowId,
      new_processed_questions: newProcessedQuestions
    }
    console.log("💾 API Request Body:", JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        auth.clearToken()
        throw new AuthenticationError(`Authentication failed: ${response.status} ${response.statusText}`, response.status)
      }
      throw new Error(`Save questions failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  },

  async getWorkflowMapping(workflowId: string) {
    return apiRequest(`/dashboard/workflow-mapping/${workflowId}`)
  },
}
