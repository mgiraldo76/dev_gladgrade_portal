// File: components/theme-toggle.tsx
"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging (keeping for now)
  useEffect(() => {
    if (mounted) {
      console.log("🎨 Theme Debug:", { 
        theme, 
        resolvedTheme,
        htmlClass: document.documentElement.className 
      })
    }
  }, [theme, resolvedTheme, mounted])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="transition-colors">
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">
              {theme === "system" ? "Auto" : 
               resolvedTheme === "dark" ? "Dark" : "Light"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem 
            onClick={() => {
              console.log("🎨 Switching to light theme")
              setTheme("light")
            }}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              console.log("🎨 Switching to dark theme")
              setTheme("dark")
            }}
            className="flex items-center gap-2"
          >
            <Moon className="h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              console.log("🎨 Switching to system theme")
              setTheme("system")
            }}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Debug info - keeping for troubleshooting */}
      {process.env.NODE_ENV === 'development' && (
        <span className="text-xs text-muted-foreground font-mono">
          {theme}/{resolvedTheme}
        </span>
      )}
    </div>
  )
}