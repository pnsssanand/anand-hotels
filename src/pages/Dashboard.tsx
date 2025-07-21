
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Star, Gift, User, History, Settings } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;

      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(bookingsQuery);
        const userBookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        
        setBookings(userBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  const tabs = [
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'history', label: 'Stay History', icon: History },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">You need to be logged in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {userProfile?.displayName || currentUser?.email}
          </h1>
          <p className="text-muted-foreground">Manage your bookings and account settings</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'bookings' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Current Bookings</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">Start planning your perfect getaway</p>
                    <Button className="btn-luxury">Browse Rooms</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Booking #{booking.id.slice(-6)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Guests:</span> {booking.guests}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span> ${booking.totalAmount}
                          </div>
                        </div>
                        
                        {booking.addOns.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm text-muted-foreground">Add-ons:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {booking.addOns.map((addOn, index) => (
                                <span key={index} className="bg-accent px-2 py-1 rounded text-xs">
                                  {addOn.name} x{addOn.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'history' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Stay History</h2>
                <div className="text-center py-8">
                  <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your completed stays will appear here</p>
                </div>
              </Card>
            )}

            {activeTab === 'rewards' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Rewards Program</h2>
                <div className="bg-gradient-primary text-white rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Gold Member</h3>
                      <p className="opacity-90">Loyalty Points</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">1,250</div>
                      <div className="text-sm opacity-90">Available Points</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Star className="w-8 h-8 text-secondary" />
                      <div>
                        <h4 className="font-medium">Free Night Reward</h4>
                        <p className="text-sm text-muted-foreground">Redeem 2,000 points</p>
                      </div>
                    </div>
                    <Button variant="outline">Redeem</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'profile' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={userProfile?.displayName || ''}
                      className="w-full p-3 border rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      className="w-full p-3 border rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Preferences</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Email notifications for booking confirmations</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">SMS notifications for check-in reminders</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Marketing emails about special offers</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
