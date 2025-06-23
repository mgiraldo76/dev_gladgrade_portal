"use client"

import { useState } from "react"
import Link from "next/link"
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
import { Menu, Bell, User } from "lucide-react"

export function Navbar() {
  const { user, role } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 fixed w-full z-50 shadow-sm">
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
              <span className="text-xl font-bold text-dark">GladGrade</span>
              <span className="text-xs text-primary font-semibold tracking-wide">PORTAL</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

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
                  <p className="text-xs text-gray-500 capitalize">{role || "client"} Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Account Preferences</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
