import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, DollarSign, Users, Calendar, 
  BarChart3, PieChart, Download, Filter
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: { month: string; amount: number }[];
    growth: number;
  };
  bookings: {
    total: number;
    monthly: { month: string; count: number }[];
    byStatus: { status: string; count: number }[];
  };
  rooms: {
    occupancyRate: number;
    popular: { roomType: string; bookings: number }[];
    revenue: { roomType: string; revenue: number }[];
  };
  guests: {
    total: number;
    new: number;
    returning: number;
    vip: number;
    loyaltyDistribution: { level: string; count: number }[];
  };
}

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('6months');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '1month':
          startDate = startOfMonth(subMonths(now, 1));
          break;
        case '3months':
          startDate = startOfMonth(subMonths(now, 3));
          break;
        case '6months':
          startDate = startOfMonth(subMonths(now, 6));
          break;
        case '1year':
          startDate = startOfMonth(subMonths(now, 12));
          break;
        default:
          startDate = startOfMonth(subMonths(now, 6));
      }

      // Fetch data from multiple collections
      const [bookingsSnapshot, usersSnapshot, roomsSnapshot] = await Promise.all([
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'rooms'))
      ]);

      // Process bookings data
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      }));

      const filteredBookings = bookingsData.filter(booking => {
        const bookingDate = parseISO(booking.createdAt);
        return isWithinInterval(bookingDate, { start: startDate, end: now });
      });

      // Process users data
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const guestsData = usersData.filter((user: any) => user.role === 'user');

      // Process rooms data
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate analytics
      const analytics: AnalyticsData = {
        revenue: calculateRevenue(filteredBookings),
        bookings: calculateBookings(filteredBookings, startDate, now),
        rooms: calculateRoomAnalytics(filteredBookings, roomsData),
        guests: calculateGuestAnalytics(guestsData, filteredBookings)
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = (bookings: any[]) => {
    const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
    const total = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    // Group by month
    const monthlyRevenue = new Map<string, number>();
    paidBookings.forEach(booking => {
      const month = format(parseISO(booking.createdAt), 'MMM yyyy');
      monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + booking.totalAmount);
    });

    const monthly = Array.from(monthlyRevenue.entries()).map(([month, amount]) => ({
      month,
      amount
    }));

    // Calculate growth (simple month-over-month if we have data)
    let growth = 0;
    if (monthly.length >= 2) {
      const lastMonth = monthly[monthly.length - 1].amount;
      const previousMonth = monthly[monthly.length - 2].amount;
      growth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
    }

    return { total, monthly, growth };
  };

  const calculateBookings = (bookings: any[], startDate: Date, endDate: Date) => {
    const total = bookings.length;
    
    // Group by month
    const monthlyBookings = new Map<string, number>();
    bookings.forEach(booking => {
      const month = format(parseISO(booking.createdAt), 'MMM yyyy');
      monthlyBookings.set(month, (monthlyBookings.get(month) || 0) + 1);
    });

    const monthly = Array.from(monthlyBookings.entries()).map(([month, count]) => ({
      month,
      count
    }));

    // Group by status
    const statusCounts = new Map<string, number>();
    bookings.forEach(booking => {
      const status = booking.bookingStatus || 'pending';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count
    }));

    return { total, monthly, byStatus };
  };

  const calculateRoomAnalytics = (bookings: any[], rooms: any[]) => {
    const totalRooms = rooms.length;
    const occupiedRooms = new Set(bookings.filter(b => b.bookingStatus === 'checked-in').map(b => b.roomId)).size;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Popular rooms by booking count
    const roomBookings = new Map<string, { count: number; revenue: number; type: string }>();
    
    bookings.forEach(booking => {
      const roomType = booking.roomType || 'Unknown';
      const current = roomBookings.get(roomType) || { count: 0, revenue: 0, type: roomType };
      current.count += 1;
      if (booking.paymentStatus === 'paid') {
        current.revenue += booking.totalAmount || 0;
      }
      roomBookings.set(roomType, current);
    });

    const popular = Array.from(roomBookings.values())
      .map(({ type, count }) => ({ roomType: type, bookings: count }))
      .sort((a, b) => b.bookings - a.bookings);

    const revenue = Array.from(roomBookings.values())
      .map(({ type, revenue }) => ({ roomType: type, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return { occupancyRate, popular, revenue };
  };

  const calculateGuestAnalytics = (guests: any[], bookings: any[]) => {
    const total = guests.length;
    
    // Calculate new vs returning guests based on booking count
    const guestBookingCounts = new Map<string, number>();
    bookings.forEach(booking => {
      const userId = booking.userId;
      guestBookingCounts.set(userId, (guestBookingCounts.get(userId) || 0) + 1);
    });

    const returning = Array.from(guestBookingCounts.values()).filter(count => count > 1).length;
    const newGuests = total - returning;

    const vip = guests.filter(g => g.isVIP === true).length;

    // Loyalty distribution
    const loyaltyCounts = new Map<string, number>();
    guests.forEach(guest => {
      const level = guest.loyaltyStatus || 'bronze';
      loyaltyCounts.set(level, (loyaltyCounts.get(level) || 0) + 1);
    });

    const loyaltyDistribution = Array.from(loyaltyCounts.entries()).map(([level, count]) => ({
      level,
      count
    }));

    return { total, new: newGuests, returning, vip, loyaltyDistribution };
  };

  const exportReport = () => {
    if (!analytics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...analytics
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Success",
      description: "Analytics report exported successfully"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Analytics Data Available</h3>
        <p className="text-muted-foreground">Analytics data will appear here once you have bookings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{analytics.revenue.total.toLocaleString()}</p>
                <p className={`text-sm ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{analytics.bookings.total}</p>
                <p className="text-sm text-muted-foreground">
                  {analytics.bookings.byStatus.find(s => s.status === 'confirmed')?.count || 0} confirmed
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold">{analytics.rooms.occupancyRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Current occupancy</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{analytics.guests.total}</p>
                <p className="text-sm text-muted-foreground">
                  {analytics.guests.vip} VIP guests
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.revenue.monthly.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.amount / Math.max(...analytics.revenue.monthly.map(m => m.amount))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">₹{item.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.bookings.monthly.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.count / Math.max(...analytics.bookings.monthly.map(m => m.count))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Room Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.rooms.popular.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.roomType}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.bookings / Math.max(...analytics.rooms.popular.map(r => r.bookings))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.bookings} bookings</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.bookings.byStatus.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{item.status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.count / analytics.bookings.total) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guest Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Guest Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">New Guests</span>
                <span className="text-sm font-medium">{analytics.guests.new}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Returning Guests</span>
                <span className="text-sm font-medium">{analytics.guests.returning}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">VIP Guests</span>
                <span className="text-sm font-medium">{analytics.guests.vip}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.guests.loyaltyDistribution.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{item.level}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.count / analytics.guests.total) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.rooms.revenue.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.roomType}</span>
                  <span className="text-sm font-medium">₹{item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
