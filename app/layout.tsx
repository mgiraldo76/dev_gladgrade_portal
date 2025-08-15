// File: app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter, Montserrat, Poppins, Open_Sans, Lato, Work_Sans, Nunito, Playfair_Display, Dancing_Script, Caveat, Kalam, Permanent_Marker, Amatic_SC, JetBrains_Mono, Fira_Code, Source_Sans_3, Merriweather, Libre_Baskerville, Crimson_Text } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })
const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'], 
  subsets: ["latin"], 
  variable: "--font-poppins" 
})
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" })
const lato = Lato({ 
  weight: ['300', '400', '700'], 
  subsets: ["latin"], 
  variable: "--font-lato" 
})
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" })
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" })
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" })
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" })
const kalam = Kalam({ 
  weight: ['300', '400', '700'], 
  subsets: ["latin"], 
  variable: "--font-kalam" 
})
const permanentMarker = Permanent_Marker({ 
  weight: '400', 
  subsets: ["latin"], 
  variable: "--font-permanent-marker" 
})
const amaticSC = Amatic_SC({ 
  weight: ['400', '700'], 
  subsets: ["latin"], 
  variable: "--font-amatic-sc" 
})
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" })
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" })
const merriweather = Merriweather({ 
  weight: ['300', '400', '700'], 
  subsets: ["latin"], 
  variable: "--font-merriweather" 
})
const libreBaskerville = Libre_Baskerville({ 
  weight: ['400', '700'], 
  subsets: ["latin"], 
  variable: "--font-libre-baskerville" 
})
const crimsonText = Crimson_Text({ 
  weight: ['400', '600', '700'], 
  subsets: ["latin"], 
  variable: "--font-crimson-text" 
})

export const metadata: Metadata = {
  title: "GladGrade Portal",
  description: "Business management portal for GladGrade services",
  icons: {
    icon: '/images/gladgrade-favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} ${poppins.variable} ${openSans.variable} ${lato.variable} ${workSans.variable} ${nunito.variable} ${playfairDisplay.variable} ${dancingScript.variable} ${caveat.variable} ${kalam.variable} ${permanentMarker.variable} ${amaticSC.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${sourceSans.variable} ${merriweather.variable} ${libreBaskerville.variable} ${crimsonText.variable} ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}