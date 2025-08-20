// components/navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"
import { signOut } from "firebase/auth"
import { auth } from "@/services/firebase"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Menu, Bell, User } from "lucide-react"

export function Navbar() {
  const { user, role } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth)
      } else {
        // Demo mode - just redirect to login
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleProfileSettings = () => {
    router.push("/dashboard/profile")
  }

  const handleHelpSupport = () => {
    router.push("/dashboard/help")
  }

  return (
    <nav className="bg-background border-b border-border px-4 py-3 fixed w-full z-50 shadow-sm">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo size="sm" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">GladGrade</span>
              <span className="text-xs text-primary font-semibold tracking-wide">PORTAL</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative opacity-50 cursor-not-allowed" disabled>
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>There are no new notifications at this time</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.email || "Demo User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role || "client"} Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileSettings} className="cursor-pointer">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHelpSupport} className="cursor-pointer">
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}