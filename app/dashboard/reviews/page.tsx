import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Reviews() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark">Customer Reviews</h1>
        <Button className="bg-primary hover:bg-primary-dark text-dark">Export Reviews</Button>
      </div>
      <p className="text-gray-600">Monitor and respond to customer feedback across all your locations.</p>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-sm text-green-600">+23% this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.2</div>
            <div className="flex text-yellow-400 mt-1">
              {"★".repeat(4)}
              {"☆".repeat(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">87%</div>
            <p className="text-sm text-blue-600">+5% improvement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-l-green-500 pl-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">★★★★★</Badge>
                  <span className="text-sm font-medium">John D.</span>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <p className="text-sm text-gray-700">
                "Excellent service! The staff was very helpful and the food was amazing."
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Respond
              </Button>
            </div>

            <div className="border-l-4 border-l-yellow-500 pl-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">★★★☆☆</Badge>
                  <span className="text-sm font-medium">Sarah M.</span>
                </div>
                <span className="text-xs text-gray-500">5 hours ago</span>
              </div>
              <p className="text-sm text-gray-700">"Good food but the wait time was longer than expected."</p>
              <Button variant="outline" size="sm" className="mt-2">
                Respond
              </Button>
            </div>

            <div className="border-l-4 border-l-red-500 pl-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">★★☆☆☆</Badge>
                  <span className="text-sm font-medium">Mike R.</span>
                </div>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
              <p className="text-sm text-gray-700">"Service was slow and the order was incorrect. Disappointed."</p>
              <Button variant="outline" size="sm" className="mt-2">
                Respond
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">Consumer feedback will display here</p>
            {/* TODO: Add review filtering and sorting options */}
            {/* TODO: Add review response functionality */}
            {/* TODO: Add image moderation for admin users */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
