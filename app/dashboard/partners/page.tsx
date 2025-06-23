import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Partners() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark">Solution Partners</h1>
        <Button className="bg-primary hover:bg-primary-dark text-dark">Find More Partners</Button>
      </div>
      <p className="text-gray-600">Connect with partners who can help improve your customer satisfaction.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg">Staff Training Solutions</CardTitle>
            <Badge className="w-fit bg-green-100 text-green-800">Recommended</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Professional training programs to improve customer service skills and satisfaction ratings.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Match Score:</span>
                <span className="font-medium text-primary">95%</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>Training & Development</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Contact Partner
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">POS System Upgrade</CardTitle>
            <Badge className="w-fit bg-blue-100 text-blue-800">Technology</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Modern point-of-sale systems to reduce wait times and improve order accuracy.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Match Score:</span>
                <span className="font-medium text-blue-600">88%</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>Technology Solutions</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Contact Partner
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg">Quality Assurance</CardTitle>
            <Badge className="w-fit bg-green-100 text-green-800">Quality</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Quality control and assurance services to maintain consistent service standards.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Match Score:</span>
                <span className="font-medium text-green-600">82%</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>Quality Management</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Contact Partner
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Partner Matching</h3>
            <p className="text-gray-600 mb-4">
              Our AI analyzes your reviews and GCSG data to recommend the most relevant solution partners.
            </p>
            <p className="text-gray-600">Matched partners appear here</p>
            {/* TODO: Add partner matching algorithm integration */}
            {/* TODO: Add partner contact functionality */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
