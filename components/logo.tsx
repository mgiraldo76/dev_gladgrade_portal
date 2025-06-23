import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "color" | "white" | "black"
  className?: string
}

export function Logo({ size = "md", variant = "color", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  }

  const logoSrc = {
    color: "/images/gladgrade-logo.png",
    white: "/images/gladgrade-logo-white.png",
    black: "/images/gladgrade-logo-black.png",
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex-shrink-0`}>
      <Image
        src={logoSrc[variant] || "/placeholder.svg"}
        alt="GladGrade Logo"
        fill
        className="object-contain"
        priority
        sizes="(max-width: 768px) 32px, (max-width: 1200px) 48px, 96px"
      />
    </div>
  )
}
