"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface AlertDialogCancelProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">{children}</div>
    </div>
  )
}

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ children, className }) => (
  <div className={cn("grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg rounded-lg", className)}>
    {children}
  </div>
)

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>{children}</div>
)

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ children, className }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
)

const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
)

const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
)

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ children, onClick, className }) => (
  <Button onClick={onClick} className={className}>
    {children}
  </Button>
)

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ children, onClick, className }) => (
  <Button variant="outline" onClick={onClick} className={cn("mt-2 sm:mt-0", className)}>
    {children}
  </Button>
)

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
