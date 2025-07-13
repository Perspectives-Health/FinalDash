interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  className?: string
}

export default function LoadingSpinner({ size = "medium", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
    </div>
  )
}
