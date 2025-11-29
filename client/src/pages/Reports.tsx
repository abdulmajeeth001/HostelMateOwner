import DesktopLayout from "@/components/layout/DesktopLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  return (
    <DesktopLayout title="Reports & Analytics" showNav={false}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-foreground">₹2,54,500</h3>
                <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
                <h3 className="text-2xl font-bold text-foreground">85%</h3>
                <p className="text-xs text-muted-foreground mt-1">38 of 42 rooms</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Rent</p>
                <h3 className="text-2xl font-bold text-foreground">₹6,250</h3>
                <p className="text-xs text-muted-foreground mt-1">Per room/month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Dues</p>
                <h3 className="text-2xl font-bold text-destructive">₹32,000</h3>
                <p className="text-xs text-destructive mt-1">From 4 tenants</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-4">
              {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((month, i) => (
                <div key={month} className="flex items-center gap-2">
                  <span className="w-10 text-sm font-medium text-muted-foreground">{month}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2" style={{ width: `${60 + i * 5}%` }}></div>
                  <span className="text-sm text-muted-foreground">₹{2 + i * 0.2}L</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select Report Type</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground">
                <option>Monthly Revenue Report</option>
                <option>Tenant Payment History</option>
                <option>Occupancy Summary</option>
                <option>Expense Breakdown</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
              <input type="month" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground" />
            </div>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>
      </div>
    </DesktopLayout>
  );
}
