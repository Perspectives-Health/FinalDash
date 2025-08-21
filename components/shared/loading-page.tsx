import LoadingSpinner from "./loading-spinner"

interface LoadingPageProps {
  title?: string
  message?: string
  variant?: "default" | "primary" | "white" | "blue"
  size?: "small" | "medium" | "large"
}

export default function LoadingPage({
  title = "Loading",
  message = "Please wait while we load your data...",
  variant = "default",
  size = "large"
}: LoadingPageProps) {
  return (
    <div className="h-[calc(100vh-96px)] flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <LoadingSpinner size={size} variant={variant} />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Predefined loading pages for common scenarios
export function AuthLoadingPage() {
  return <LoadingPage title="Authenticating" message="Please wait while we verify your credentials..." />
}

export function DashboardLoadingPage() {
  return <LoadingPage title="Loading Dashboard" message="Please wait while we prepare your dashboard..." />
}

export function DataLoadingPage() {
  return <LoadingPage title="Loading Data" message="Please wait while we fetch your data..." />
}

export function UserDataLoadingPage() {
  return <LoadingPage title="Loading User Data" message="Please wait while we load user information..." />
}

export function SessionLoadingPage() {
  return <LoadingPage title="Loading Sessions" message="Please wait while we load session data..." />
}

export function MetricsLoadingPage() {
  return <LoadingPage title="Loading Metrics" message="Please wait while we load analytics data..." />
}
