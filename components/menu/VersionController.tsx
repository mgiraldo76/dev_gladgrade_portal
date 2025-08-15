// Path: /components/menu/VersionController.tsx
// Name: Version Controller - Menu History and Version Management with Menu Support

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  History, 
  Save, 
  RotateCcw,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Download,
  Upload
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface MenuVersion {
  id: string
  version_name: string
  menu_name: string // NEW: Track which menu this version belongs to
  config_snapshot: any
  items_snapshot: any[]
  created_by: string
  created_at: string
  is_published: boolean
  change_notes?: string
}

interface VersionControllerProps {
  currentVersion: string
  selectedMenu: string // NEW: Track which menu we're managing versions for
  onVersionChange: (version: string) => void
  onRevert: (version: MenuVersion) => void
}

export function VersionController({ 
  currentVersion, 
  selectedMenu, 
  onVersionChange, 
  onRevert 
}: VersionControllerProps) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<MenuVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [changeNotes, setChangeNotes] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<MenuVersion | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    loadVersionHistory()
  }, [selectedMenu]) // Reload when menu changes

  const loadVersionHistory = async () => {
    setIsLoading(true)
    try {
      // Mock version history filtered by menu - replace with actual API call
      const mockVersions: MenuVersion[] = [
        {
          id: 'v1',
          version_name: 'Initial Setup',
          menu_name: selectedMenu,
          config_snapshot: { layout_type: 'list', theme: { bg_color: '#f5f5f5' } },
          items_snapshot: [],
          created_by: 'Admin',
          created_at: '2024-01-15T10:00:00Z',
          is_published: true,
          change_notes: `Initial ${selectedMenu} configuration`
        },
        {
          id: 'v2',
          version_name: 'Added Categories',
          menu_name: selectedMenu,
          config_snapshot: { layout_type: 'grid', theme: { bg_color: '#ffffff' } },
          items_snapshot: [
            { id: '1', data: { name: 'Sample Item', price: 12.99 }, menu_name: selectedMenu }
          ],
          created_by: 'Admin',
          created_at: '2024-01-16T14:30:00Z',
          is_published: true,
          change_notes: `Added food categories and first items to ${selectedMenu}`
        },
        {
          id: 'v3',
          version_name: 'Theme Update',
          menu_name: selectedMenu,
          config_snapshot: { layout_type: 'grid', theme: { bg_color: '#fef7ed' } },
          items_snapshot: [
            { id: '1', data: { name: 'Sample Item', price: 12.99 }, menu_name: selectedMenu },
            { id: '2', data: { name: 'New Item', price: 8.99 }, menu_name: selectedMenu }
          ],
          created_by: 'Admin',
          created_at: '2024-01-17T09:15:00Z',
          is_published: false,
          change_notes: `Updated color scheme and added new items to ${selectedMenu}`
        }
      ]
      
      // Filter versions for the selected menu
      const menuVersions = mockVersions.filter(v => v.menu_name === selectedMenu)
      setVersions(menuVersions)
    } catch (error) {
      toast({
        title: "Error Loading History",
        description: `Failed to load version history for ${selectedMenu}.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveNewVersion = async () => {
    if (!newVersionName.trim()) {
      toast({
        title: "Version Name Required",
        description: "Please enter a name for this version.",
        variant: "destructive"
      })
      return
    }

    try {
      const newVersion: MenuVersion = {
        id: `v${Date.now()}`,
        version_name: newVersionName,
        menu_name: selectedMenu, // Associate with current menu
        config_snapshot: {}, // Current config would go here
        items_snapshot: [], // Current items would go here
        created_by: 'Current User',
        created_at: new Date().toISOString(),
        is_published: false,
        change_notes: changeNotes
      }

      setVersions([newVersion, ...versions])
      setNewVersionName('')
      setChangeNotes('')
      setIsSaveDialogOpen(false)

      toast({
        title: "Version Saved",
        description: `Version "${newVersionName}" has been saved for ${selectedMenu}.`,
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save version. Please try again.",
        variant: "destructive"
      })
    }
  }

  const revertToVersion = async (version: MenuVersion) => {
    try {
      onRevert(version)
      onVersionChange(version.version_name)
      
      toast({
        title: "Version Restored",
        description: `Reverted ${selectedMenu} to version "${version.version_name}".`,
      })
    } catch (error) {
      toast({
        title: "Revert Failed",
        description: "Failed to revert to selected version.",
        variant: "destructive"
      })
    }
  }

  const publishVersion = async (versionId: string) => {
    try {
      setVersions(prev => prev.map(v => ({
        ...v,
        is_published: v.id === versionId ? true : v.is_published
      })))

      toast({
        title: "Version Published",
        description: `Version is now live for ${selectedMenu}.`,
      })
    } catch (error) {
      toast({
        title: "Publish Failed",
        description: "Failed to publish version.",
        variant: "destructive"
      })
    }
  }

  const exportVersion = (version: MenuVersion) => {
    const exportData = {
      menu_name: version.menu_name,
      version: version.version_name,
      config: version.config_snapshot,
      items: version.items_snapshot,
      exported_at: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${version.menu_name.replace(/\s+/g, '-')}-${version.version_name.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Version Exported",
      description: `${selectedMenu} version data has been downloaded.`,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading version history for {selectedMenu}...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History - {selectedMenu}
          </CardTitle>
          <CardDescription>
            Track changes and manage different versions of {selectedMenu}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Current: {currentVersion}
              </Badge>
              <Badge variant="outline">
                {versions.length} versions saved for {selectedMenu}
              </Badge>
            </div>
            
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save New Version
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save New Version for {selectedMenu}</DialogTitle>
                  <DialogDescription>
                    Create a snapshot of your current {selectedMenu} configuration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="version-name">Version Name</Label>
                    <Input
                      id="version-name"
                      value={newVersionName}
                      onChange={(e) => setNewVersionName(e.target.value)}
                      placeholder={`e.g., ${selectedMenu} Update v2.0`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="change-notes">Change Notes (Optional)</Label>
                    <Textarea
                      id="change-notes"
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      placeholder={`Describe what changed in ${selectedMenu}...`}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveNewVersion}>
                    Save Version
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Version List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Versions for {selectedMenu}</CardTitle>
          <CardDescription>
            View, restore, or manage your {selectedMenu} versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Archive className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No versions saved for {selectedMenu} yet</p>
              <p className="text-sm">Save your first version to track changes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    version.is_published 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Version Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{version.version_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {version.menu_name}
                      </Badge>
                      {version.is_published && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      )}
                      {currentVersion === version.version_name && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </span>
                      <span>by {version.created_by}</span>
                      <span>{version.items_snapshot.length} items</span>
                    </div>
                    
                    {version.change_notes && (
                      <p className="text-sm text-gray-700 mt-1">{version.change_notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVersion(version)
                        setIsPreviewOpen(true)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportVersion(version)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>

                    {!version.is_published && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publishVersion(version.id)}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-4 w-4" />
                        Publish
                      </Button>
                    )}

                    {currentVersion !== version.version_name && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore Version</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to restore {selectedMenu} to "{version.version_name}"? 
                              This will replace your current configuration and items for this menu.
                              Consider saving your current work as a new version first.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => revertToVersion(version)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Restore Version
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Preview Dialog */}
      {selectedVersion && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Version Preview: {selectedVersion.version_name}</DialogTitle>
              <DialogDescription>
                Configuration and items from this version of {selectedVersion.menu_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{selectedVersion.menu_name}</Badge>
                <Badge variant="outline">{selectedVersion.version_name}</Badge>
                {selectedVersion.is_published && (
                  <Badge className="bg-green-600">Published</Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Configuration</h4>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <pre>{JSON.stringify(selectedVersion.config_snapshot, null, 2)}</pre>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Items ({selectedVersion.items_snapshot.length})</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedVersion.items_snapshot.map((item: any, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{item.data?.name || 'Unnamed Item'}</span>
                      <span className="text-green-600 font-bold">
                        ${item.data?.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedVersion.change_notes && (
                <div>
                  <h4 className="font-medium mb-2">Change Notes</h4>
                  <div className="p-3 bg-blue-50 rounded text-sm">
                    {selectedVersion.change_notes}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              {currentVersion !== selectedVersion.version_name && (
                <Button 
                  onClick={() => {
                    revertToVersion(selectedVersion)
                    setIsPreviewOpen(false)
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This Version
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Version Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Version Statistics - {selectedMenu}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{versions.length}</div>
              <div className="text-sm text-gray-600">Total Versions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {versions.filter(v => v.is_published).length}
              </div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {versions.length > 0 
                  ? Math.round(versions.reduce((sum, v) => sum + v.items_snapshot.length, 0) / versions.length)
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {versions.length > 0 ? Math.round((Date.now() - new Date(versions[versions.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className="text-sm text-gray-600">Days Since First</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}