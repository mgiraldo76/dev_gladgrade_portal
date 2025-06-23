import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark">Reports & Analytics</h1>
        <Button className="bg-primary hover:bg-primary-dark text-dark">Generate Report</Button>
      </div>
      <p className="text-gray-600">Gain insights from your customer satisfaction data.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>GCSG Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">785</div>
                <p className="text-gray-600">Current GCSG Score</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last Month:</span>
                    <span className="font-medium">770</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>3 Months Ago:</span>
                    <span className="font-medium">745</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>6 Months Ago:</span>
                    <span className="font-medium">720</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-4">AI-generated insights and GCSG trends</p>
            {/* TODO: Add trend visualization components */}
            {/* TODO: Add export features for reports */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Positive</span>
                <span className="text-sm text-green-600">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "68%" }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Neutral</span>
                <span className="text-sm text-yellow-600">22%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "22%" }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Negative</span>
                <span className="text-sm text-red-600">10%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: "10%" }}></div>
              </div>
            </div>
            <p className="text-gray-600 mt-4">Customer sentiment breakdown</p>
            {/* TODO: Add AI sentiment analysis visualization */}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">94%</div>
              <div className="text-sm text-gray-600">Customer Retention</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">4.2</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">87%</div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-gray-600">Avg Response Time (hrs)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
