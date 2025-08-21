interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  className?: string
  variant?: "default" | "primary" | "white" | "blue"
  showText?: boolean
  text?: string
  fullScreen?: boolean
  centered?: boolean
}

export default function LoadingSpinner({ 
  size = "medium", 
  className = "", 
  variant = "default",
  showText = false,
  text = "Loading...",
  fullScreen = false,
  centered = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  }

  const variantClasses = {
    default: "border-gray-300 border-t-blue-600",
    primary: "border-gray-300 border-t-blue-600",
    white: "border-white/30 border-t-white",
    blue: "border-blue-200 border-t-blue-600",
  }

  const spinnerElement = (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 ${variantClasses[variant]}`} />
  )

  // If showing text, use consistent height layout
  if (showText || fullScreen) {
    return (
      <div className="h-[calc(100vh-96px)] flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6">
          {spinnerElement}
          {showText && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Loading</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">{text}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${centered ? 'h-full' : ''} ${className}`}>
      {spinnerElement}
    </div>
  )
}
