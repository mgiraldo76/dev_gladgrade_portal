"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, Building, MapPin, Star, Calendar, User, Phone, Globe, Shield, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const [newClientUser, setNewClientUser] = useState({
    business_id: 0,
    user_email: "",
    user_name: "",
    user_role: "client_admin",
    create_firebase_account: true,
    temporary_password: "",
  })

  // Load clients on component mount
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      console.log("📊 Loading business clients...")

      const response = await apiClient.getClients()
      if (response.success) {
        setClients(response.data)
        console.log("✅ Clients loaded:", response.data.length)
      }
    } catch (error) {
      console.error("❌ Error loading clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClientUser = async () => {
    if (!newClientUser.user_email || !newClientUser.user_name) {
      alert("Email and name are required")
      return
    }

    try {
      console.log("👤 Creating client user for business:", selectedClient?.businessname)

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newClientUser,
          business_id: selectedClient?.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewClientUser({
          business_id: 0,
          user_email: "",
          user_name: "",
          user_role: "client_admin",
          create_firebase_account: true,
          temporary_password: "",
        })
        setIsCreateUserOpen(false)
        setSelectedClient(null)

        // Show success message
        if (result.firebase_account_created) {
          alert(
            `✅ Client user created successfully!\n\n🔥 Firebase account created\n🔑 Temporary password: ${result.temporary_password || "Auto-generated"}\n\n📧 The client can now log in with their email and password.`,
          )
        } else {
          alert("✅ Client user created successfully in database only (no Firebase account)")
        }

        // Reload clients
        loadClients()
        console.log("✅ Client user created:", result.data)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("❌ Error creating client user:", error)
      alert("Failed to create client user. Please try again.")
    }
  }

  const handleManageClient = (client: any) => {
    setSelectedClient(client)
    setNewClientUser({
      ...newClientUser,
      business_id: client.id,
    })
    setIsCreateUserOpen(true)
  }

  const filteredClients = clients.filter(
    (client) =>
      client.businessname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Business Clients</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">GladGrade Mobile App Integration</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Claim Business
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search businesses, contacts, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{client.businessname}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {client.contact_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{client.contact_name}</span>
                        </div>
                      )}
                      {client.contact_email && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>{client.contact_email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      {client.streetaddress && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {client.streetaddress}, {client.city}, {client.state}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {new Date(client.datecreated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* GCSG Score */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{client.gcsg_score}</div>
                    <div className="text-xs text-gray-500">GCSG Score</div>
                  </div>

                  {/* Reviews */}
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{client.average_rating}</span>
                    </div>
                    <div className="text-xs text-gray-500">{client.total_reviews} reviews</div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-2">
                    <Badge variant={client.isverified ? "default" : "secondary"}>
                      {client.isverified ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        "Unverified"
                      )}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={client.isactive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
                    >
                      {client.isactive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Sales Rep */}
                  <div className="text-right">
                    <div className="text-sm font-medium">{client.sales_rep_name || "No Sales Rep"}</div>
                    <div className="text-xs text-gray-500">Sales Representative</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleManageClient(client)}>
                      Manage
                    </Button>
                    {client.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={client.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Type and Place ID */}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>Type: {client.business_type_name || client.businesstype}</span>
                {client.placeid && <span>Place ID: {client.placeid}</span>}
                {client.firebaseuid && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                    Firebase User
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Client User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create Client User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a portal user for {selectedClient?.businessname}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Full Name</Label>
              <Input
                id="client-name"
                placeholder="John Smith"
                value={newClientUser.user_name}
                onChange={(e) => setNewClientUser({ ...newClientUser, user_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="john@business.com"
                value={newClientUser.user_email}
                onChange={(e) => setNewClientUser({ ...newClientUser, user_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-role">Role</Label>
              <Select
                value={newClientUser.user_role}
                onValueChange={(value) => setNewClientUser({ ...newClientUser, user_role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_admin">Business Admin</SelectItem>
                  <SelectItem value="client_manager">Business Manager</SelectItem>
                  <SelectItem value="client_user">Business User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-password">Temporary Password (optional)</Label>
              <Input
                id="temp-password"
                type="password"
                placeholder="Leave empty for auto-generated"
                value={newClientUser.temporary_password}
                onChange={(e) => setNewClientUser({ ...newClientUser, temporary_password: e.target.value })}
              />
              <p className="text-xs text-gray-500">If empty, a secure password will be auto-generated</p>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateClientUser}
              className="bg-primary hover:bg-primary-dark text-dark"
              disabled={!newClientUser.user_email || !newClientUser.user_name}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{clients.length}</div>
                <div className="text-sm text-gray-600">Total Businesses</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{clients.filter((c) => c.isverified).length}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {clients.length > 0
                    ? Math.round(clients.reduce((sum, c) => sum + c.gcsg_score, 0) / clients.length)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg GCSG</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{clients.reduce((sum, c) => sum + c.total_reviews, 0)}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
