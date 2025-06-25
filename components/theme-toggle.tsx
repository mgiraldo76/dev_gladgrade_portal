"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    if (mounted) {
      console.log("🎨 Theme Debug:", { theme, resolvedTheme })
      console.log("🎨 HTML class:", document.documentElement.className)
    }
  }, [theme, resolvedTheme, mounted])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    console.log("🎨 Switching theme from", theme, "to", newTheme)
    setTheme(newTheme)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleThemeToggle} className="transition-colors">
        {resolvedTheme === "dark" ? (
          <>
            <Sun className="h-4 w-4 mr-2" />
            Light Mode
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 mr-2" />
            Dark Mode
          </>
        )}
      </Button>
      {/* Debug info - remove this later */}
      <span className="text-xs text-gray-500">{mounted ? `${theme}/${resolvedTheme}` : "loading"}</span>
    </div>
  )
}
