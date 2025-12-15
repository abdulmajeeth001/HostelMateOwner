import DesktopLayout from "@/components/layout/DesktopLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  FileText,
  IndianRupee,
  Home,
} from "lucide-react";

export default function Reports() {
  const revenueData = [
    { month: 'Jun', value: 200000, percentage: 60 },
    { month: 'Jul', value: 210000, percentage: 65 },
    { month: 'Aug', value: 220000, percentage: 70 },
    { month: 'Sep', value: 230000, percentage: 75 },
    { month: 'Oct', value: 240000, percentage: 80 },
    { month: 'Nov', value: 254500, percentage: 85 },
  ];

  return (
    <DesktopLayout title="Reports & Analytics" showNav>
      {/* Gradient Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-reports">
                Reports & Analytics
              </h2>
              <p className="text-white/80 text-sm">
                Track performance metrics and generate custom reports
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-revenue">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <IndianRupee className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1" data-testid="stat-revenue">
                  ₹2,54,500
                </p>
                <p className="text-xs text-green-600 font-medium">↑ 12% from last month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-occupancy">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Occupancy Rate</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1" data-testid="stat-occupancy">
                  85%
                </p>
                <p className="text-xs text-muted-foreground">38 of 42 rooms</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-avg-rent">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Rent</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1" data-testid="stat-avg-rent">
                  ₹6,250
                </p>
                <p className="text-xs text-muted-foreground">Per room/month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-dues">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Dues</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1" data-testid="stat-dues">
                  ₹32,000
                </p>
                <p className="text-xs text-muted-foreground">From 4 tenants</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Report Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-revenue-chart">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Revenue Trend (Last 6 Months)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4 pt-2">
                {revenueData.map((item) => (
                  <div key={item.month} className="space-y-1" data-testid={`chart-bar-${item.month}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{item.month}</span>
                      <span className="font-semibold">₹{(item.value / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Generator */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-report-generator">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Report Generator</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="report-type">
                  Select Report Type
                </label>
                <Select defaultValue="revenue">
                  <SelectTrigger id="report-type" data-testid="select-report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue" data-testid="option-revenue">
                      Monthly Revenue Report
                    </SelectItem>
                    <SelectItem value="payment" data-testid="option-payment">
                      Tenant Payment History
                    </SelectItem>
                    <SelectItem value="occupancy" data-testid="option-occupancy">
                      Occupancy Summary
                    </SelectItem>
                    <SelectItem value="expense" data-testid="option-expense">
                      Expense Breakdown
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="date-range">
                  Date Range
                </label>
                <input 
                  id="date-range"
                  type="month" 
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  data-testid="input-date-range"
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2"
                data-testid="button-generate"
              >
                <Download className="w-4 h-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-room-types">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base">Room Types</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Single</span>
                <span className="font-semibold">12 rooms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Double</span>
                <span className="font-semibold">18 rooms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Triple</span>
                <span className="font-semibold">12 rooms</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-payment-status">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base">Payment Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-semibold text-green-600">34 tenants</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-orange-600">4 tenants</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-red-600">0 tenants</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-recent-activity">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base">This Month</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Tenants</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Check-outs</span>
                <span className="font-semibold">1</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-semibold">5 tasks</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DesktopLayout>
  );
}
