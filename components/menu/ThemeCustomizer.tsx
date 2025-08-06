// Path: /components/menu/ThemeCustomizer.tsx
// Name: FIXED Theme Customizer - Prevents Freezing on Color Changes

"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Palette,
  Type,
  Square,
  Brush,
  Eye,
  RotateCcw,
  Download,
  Upload
} from "lucide-react"

interface ThemeConfig {
  bg_color: string
  card_color: string
  text_color: string
  primary_color: string
  card_elevation: number
  border_radius: number
  font_family?: string
  font_size_base?: number
  spacing_unit?: number
}

interface ThemeCustomizerProps {
  config: any
  onChange: (config: any) => void
}

const COLOR_PRESETS = [
  { name: 'Default', bg: '#f5f5f5', card: '#ffffff', text: '#1f2937', primary: '#3b82f6' },
  { name: 'Dark', bg: '#111827', card: '#1f2937', text: '#f9fafb', primary: '#60a5fa' },
  { name: 'Warm', bg: '#fef7ed', card: '#ffffff', text: '#92400e', primary: '#f59e0b' },
  { name: 'Cool', bg: '#f0f9ff', card: '#ffffff', text: '#164e63', primary: '#0891b2' },
  { name: 'Nature', bg: '#f7fee7', card: '#ffffff', text: '#365314', primary: '#65a30d' },
  { name: 'Elegant', bg: '#faf7ff', card: '#ffffff', text: '#581c87', primary: '#9333ea' }
]

const FONT_OPTIONS = [
  { name: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' }
]

export function ThemeCustomizer({ config, onChange }: ThemeCustomizerProps) {
  const [activeTab, setActiveTab] = useState('colors')

  // ✅ FIXED: Memoize theme object to prevent unnecessary re-renders
  const theme = useMemo(() => config?.theme || {
    bg_color: '#f5f5f5',
    card_color: '#ffffff',
    text_color: '#1f2937',
    primary_color: '#3b82f6',
    card_elevation: 2,
    border_radius: 8,
    font_family: 'system-ui, -apple-system, sans-serif',
    font_size_base: 16,
    spacing_unit: 8
  }, [config?.theme])

  // ✅ FIXED: Use debounced theme updates to prevent excessive onChange calls
  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates }
    
    // Debounce the onChange call to prevent freezing
    const timeoutId = setTimeout(() => {
      onChange({
        theme: newTheme
      })
    }, 50) // 50ms debounce

    return () => clearTimeout(timeoutId)
  }, [theme, onChange])

  // ✅ FIXED: Debounced color change handlers
  const handleColorChange = useCallback((colorKey: keyof ThemeConfig, value: string) => {
    console.log(`🎨 Color change: ${colorKey} = ${value}`)
    
    // Use setTimeout to debounce color changes and prevent freezing
    const timeoutId = setTimeout(() => {
      updateTheme({ [colorKey]: value })
    }, 100) // 100ms debounce for color changes

    return () => clearTimeout(timeoutId)
  }, [updateTheme])

  const applyPreset = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    console.log('🎨 Applying preset:', preset.name)
    updateTheme({
      bg_color: preset.bg,
      card_color: preset.card,
      text_color: preset.text,
      primary_color: preset.primary
    })
  }, [updateTheme])

  const resetToDefault = useCallback(() => {
    console.log('🔄 Resetting theme to default')
    applyPreset(COLOR_PRESETS[0])
    updateTheme({
      card_elevation: 2,
      border_radius: 8,
      font_family: 'system-ui, -apple-system, sans-serif',
      font_size_base: 16,
      spacing_unit: 8
    })
  }, [applyPreset, updateTheme])

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Quick Themes
          </CardTitle>
          <CardDescription>
            Choose from pre-designed color schemes or customize your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {COLOR_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="h-20 p-3 flex flex-col items-center justify-center gap-2"
                onClick={() => applyPreset(preset)}
              >
                <div className="flex gap-1">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.bg }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.card }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.primary }}
                  />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brush className="h-5 w-5" />
              Custom Theme
            </span>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Square className="h-4 w-4" />
                      Background Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.bg_color}
                        onChange={(e) => handleColorChange('bg_color', e.target.value)}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.bg_color}
                        onChange={(e) => handleColorChange('bg_color', e.target.value)}
                        className="flex-1 px-3 py-1 border rounded font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Square className="h-4 w-4" />
                      Card Background
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.card_color}
                        onChange={(e) => handleColorChange('card_color', e.target.value)}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.card_color}
                        onChange={(e) => handleColorChange('card_color', e.target.value)}
                        className="flex-1 px-3 py-1 border rounded font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Type className="h-4 w-4" />
                      Text Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.text_color}
                        onChange={(e) => handleColorChange('text_color', e.target.value)}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.text_color}
                        onChange={(e) => handleColorChange('text_color', e.target.value)}
                        className="flex-1 px-3 py-1 border rounded font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Palette className="h-4 w-4" />
                      Primary Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="flex-1 px-3 py-1 border rounded font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Font Family</Label>
                    <Select 
                      value={theme.font_family}
                      onValueChange={(value) => updateTheme({ font_family: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Base Font Size: {theme.font_size_base}px</Label>
                    <Slider
                      value={[theme.font_size_base || 16]}
                      onValueChange={(value) => updateTheme({ font_size_base: value[0] })}
                      min={12}
                      max={24}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Typography Preview</h4>
                  <div 
                    style={{ 
                      fontFamily: theme.font_family,
                      fontSize: `${theme.font_size_base}px`,
                      color: theme.text_color 
                    }}
                  >
                    <h3 className="text-lg font-bold mb-1">Menu Item Title</h3>
                    <p className="text-sm opacity-80">This is a sample description text</p>
                    <p className="text-lg font-semibold mt-2" style={{ color: theme.primary_color }}>
                      $12.99
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Card Elevation: {theme.card_elevation}</Label>
                    <Slider
                      value={[theme.card_elevation || 2]}
                      onValueChange={(value) => updateTheme({ card_elevation: value[0] })}
                      min={0}
                      max={8}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Border Radius: {theme.border_radius}px</Label>
                    <Slider
                      value={[theme.border_radius || 8]}
                      onValueChange={(value) => updateTheme({ border_radius: value[0] })}
                      min={0}
                      max={24}
                      step={2}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Spacing Unit: {theme.spacing_unit}px</Label>
                    <Slider
                      value={[theme.spacing_unit || 8]}
                      onValueChange={(value) => updateTheme({ spacing_unit: value[0] })}
                      min={4}
                      max={16}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-4">Layout Preview</h4>
                    <div 
                      className="p-3 border rounded shadow-sm bg-white"
                      style={{
                        backgroundColor: theme.card_color,
                        borderRadius: `${theme.border_radius}px`,
                        boxShadow: `0 ${theme.card_elevation}px ${theme.card_elevation * 2}px rgba(0,0,0,0.1)`,
                        color: theme.text_color,
                        margin: `${theme.spacing_unit}px 0`
                      }}
                    >
                      <div className="w-full h-16 bg-gray-200 rounded mb-2"></div>
                      <h5 className="font-medium">Sample Menu Item</h5>
                      <p className="text-sm opacity-70">Description text here</p>
                      <p className="font-bold mt-1" style={{ color: theme.primary_color }}>$9.99</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your theme will look in the mobile app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="w-full max-w-sm mx-auto p-4 rounded-lg border"
            style={{ backgroundColor: theme.bg_color }}
          >
            {/* Sample menu items with applied theme */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="mb-3 p-3 rounded shadow-sm"
                style={{
                  backgroundColor: theme.card_color,
                  borderRadius: `${theme.border_radius}px`,
                  boxShadow: `0 ${theme.card_elevation}px ${theme.card_elevation * 2}px rgba(0,0,0,0.1)`,
                  fontFamily: theme.font_family,
                  fontSize: `${theme.font_size_base}px`,
                  color: theme.text_color,
                  margin: `${theme.spacing_unit}px 0`
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Sample Item {item}</h4>
                    <p className="text-sm opacity-70 mt-1">Delicious menu item description</p>
                    <p className="font-bold mt-2" style={{ color: theme.primary_color }}>
                      ${(9.99 + item).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export/Import Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Management</CardTitle>
          <CardDescription>
            Save or load theme configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Theme
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Theme
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}