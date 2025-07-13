export interface MetricsData {
  usersToday: {
    unique_users: number
    unique_sessions: number
    date: string
  }
  lastUse: Array<{
    email: string
    id: string
    last_use_pacific: string
  }>
  dau: Array<{
    date: string
    unique_users: number
    user_emails: string[]
    unique_sessions: number
  }>
  weeklyUsers: Array<{
    week_start: string
    unique_users: number
    user_emails: string[]
    unique_sessions: number
  }>
  sessionsTodayByUser: Array<{
    user_id: string
    email: string
    total_sessions: number
    latest_pacific_time: string
  }>
  sessionsToday: Array<{
    id: string
    user_id: string
    email: string
    date: string
    pacific_time: string
  }>
  allSessions: Array<{
    id: string
    user_id: string
    email: string
    date: string
    pacific_time: string
  }>
}
