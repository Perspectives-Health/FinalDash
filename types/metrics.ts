export interface GeneralMetrics {
  avg_sessions_per_day: number;
  avg_sessions_per_week: number;
  avg_sessions_per_month: number;
  stickiness: number;
}

export interface MetricsData {
  usersToday: {
    unique_users: number;
    unique_sessions: number;
    date: string;
  };
  lastUse: Array<{
    email: string;
    id: string;
    last_use_pacific: string;
  }>;
  dau: Array<{
    date: string;
    unique_users: number;
    user_emails: string[];
    unique_sessions: number;
  }>;
  weeklyUsers: Array<{
    week_start: string;
    unique_users: number;
    user_emails: string[];
    unique_sessions: number;
  }>;
  sessionsTodayByUser: Array<{
    user_id: string;
    email: string;
    total_sessions: number;
    latest_pacific_time: string;
  }>;
  sessionsToday: Array<{
    id: string;
    user_id: string;
    email: string;
    date: string;
    pacific_time: string;
  }>;
  allSessions: Array<{
    id: string;
    user_id: string;
    email: string;
    date: string;
    pacific_time: string;
  }>;
  allUsersAnalyticsByCenter: AllUsersPerCenterAnalyticsResponse;
  generalMetrics?: GeneralMetrics;
}

export interface UserAnalyticsDetailResponse {
  user_id: string;
  email: string;
  center_name: string | null;
  last_session_time: string | null;
  total_sessions: number;
  user_type: string;
  curr_extension_version: string | null;
  followed_up_since: string | null;
  ignore_user: boolean; // New: Added ignore_user property
  avg_sessions_daily?: number; // Made optional
  avg_sessions_weekly?: number; // Made optional
  avg_sessions_monthly?: number; // Made optional
  notes: string | null; // Added notes field
}

export interface CenterAnalyticsSummaryResponse {
  center_name: string;
  total_users: number;
  active_users_count: number;
  inactive_users_count: number;
  average_sessions_per_user: number;
  users: UserAnalyticsDetailResponse[];
  avg_sessions_daily?: number; // Made optional
  avg_sessions_weekly?: number; // Made optional
  avg_sessions_monthly?: number; // Made optional
}

export interface InactiveUsersOverviewResponse {
  total_inactive_users: number;
  most_inactive_center_name: string | null;
  average_inactivity_days: number;
}

export interface AllUsersPerCenterAnalyticsResponse {
  inactive_users_overview: InactiveUsersOverviewResponse;
  centers_data: CenterAnalyticsSummaryResponse[];
  inactive_threshold_days: number;
}
