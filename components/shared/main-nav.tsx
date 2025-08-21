"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  // Define props if any, e.g., items: { href: string; label: string }[]
}

export function MainNav({
  className,
  ...props
}: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center space-x-1", className)}
      {...props}
    >
      <Link 
        href="/"
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors",
          pathname === "/" ? "bg-blue-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        )}
      >
        Dashboard
      </Link>
      <Link 
        href="/users"
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors",
          pathname === "/users" ? "bg-blue-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        )}
      >
        Browse Users & Sessions
      </Link>
      <Link 
        href="/user-data"
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors",
          pathname === "/user-data" ? "bg-blue-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        )}
      >
        User Data
      </Link>
    </nav>
  )
} 