const TOKEN_KEY = 'auth_token'
const TOKEN_EXPIRY_KEY = 'auth_token_expiry'

export interface AuthTokens {
  access_token: string
  expires_at?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type?: string
  expires_in?: number
}

export class AuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'AuthError'
  }
}

export const auth = {
  /**
   * Store auth tokens in localStorage with expiration
   */
  setToken(tokens: AuthTokens): void {
    try {
      localStorage.setItem(TOKEN_KEY, tokens.access_token)
      if (tokens.expires_at) {
        localStorage.setItem(TOKEN_EXPIRY_KEY, tokens.expires_at.toString())
      }
    } catch (error) {
      console.warn('Failed to store auth token:', error)
    }
  },

  /**
   * Get stored auth token if valid
   */
  getToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
      
      if (!token) return null
      
      // Check if token has expired
      if (expiry) {
        const expiryTime = parseInt(expiry, 10)
        if (Date.now() > expiryTime) {
          this.clearToken()
          return null
        }
      }
      
      return token
    } catch (error) {
      console.warn('Failed to retrieve auth token:', error)
      return null
    }
  },

  /**
   * Clear stored auth tokens
   */
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
    } catch (error) {
      console.warn('Failed to clear auth token:', error)
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null
  },

  /**
   * Login user and store tokens
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const API_BASE_URL = process.env.NODE_ENV === 'production'
      ? "https://perspectiveshealth.ddns.net" 
      : "http://localhost:5001"
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthError('Invalid email or password', 401)
        }
        throw new AuthError(`Login failed: ${response.status} ${response.statusText}`, response.status)
      }

      const data: LoginResponse = await response.json()
      
      // Calculate expiration time (default to 24 hours if not provided)
      const expiresIn = data.expires_in || 24 * 60 * 60 // 24 hours in seconds
      const expiresAt = Date.now() + (expiresIn * 1000)
      
      // Store tokens
      this.setToken({
        access_token: data.access_token,
        expires_at: expiresAt,
      })
      
      return data
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Network error during login')
    }
  },

  /**
   * Logout user and clear tokens
   */
  logout(): void {
    this.clearToken()
  },

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
}