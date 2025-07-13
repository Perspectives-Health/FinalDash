interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase()

    if (normalizedStatus.includes("complete") || normalizedStatus.includes("active")) {
      return "bg-green-100 text-green-800"
    }
    if (normalizedStatus.includes("pending") || normalizedStatus.includes("progress")) {
      return "bg-yellow-100 text-yellow-800"
    }
    if (normalizedStatus.includes("failed") || normalizedStatus.includes("error")) {
      return "bg-red-100 text-red-800"
    }
    return "bg-gray-100 text-gray-800"
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {status}
    </span>
  )
}
