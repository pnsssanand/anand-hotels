
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Calendar, DollarSign, TrendingUp, Gift, BarChart3, 
  Plus, Eye, Edit, Trash2, Search, Filter, Download
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import RoomCRUD from '@/components/admin/RoomCRUD';
import BookingCRUD from '@/components/admin/BookingCRUD';
import GuestCRUD from '@/components/admin/GuestCRUD';
import PromotionCRUD from '@/components/admin/PromotionCRUD';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentActivity from '@/components/admin/RecentActivity';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    averageStay: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch rooms
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const totalRooms = roomsSnapshot.size;
      
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const totalBookings = bookingsSnapshot.size;
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Calculate revenue (mock calculation)
      let totalRevenue = 0;
      bookingsSnapshot.docs.forEach(doc => {
        const booking = doc.data();
        if (booking.status === 'confirmed') {
          totalRevenue += booking.totalAmount || 0;
        }
      });
      
      setStats({
        totalRooms,
        totalBookings,
        totalUsers,
        totalRevenue,
        occupancyRate: totalBookings > 0 ? Math.round((totalBookings / (totalRooms * 30)) * 100) : 0,
        averageStay: 2.3 // Mock data
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'rooms', label: 'Rooms', icon: Calendar },
    { value: 'bookings', label: 'Bookings', icon: Calendar },
    { value: 'guests', label: 'Guests', icon: Users },
    { value: 'promotions', label: 'Promotions', icon: Gift }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your hotel operations</p>
        </div>
        <Button className="btn-luxury">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardStats stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setActiveTab('rooms')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Room
                </Button>
                <Button 
                  onClick={() => setActiveTab('promotions')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Create Promotion
                </Button>
                <Button 
                  onClick={() => setActiveTab('bookings')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Bookings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms">
          <RoomCRUD />
        </TabsContent>

        <TabsContent value="bookings">
          <BookingCRUD />
        </TabsContent>

        <TabsContent value="guests">
          <GuestCRUD />
        </TabsContent>

        <TabsContent value="promotions">
          <PromotionCRUD />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
