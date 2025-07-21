
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Search, Filter, User, Calendar, Mail } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface Guest {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  preferences?: {
    favoriteRoomType?: string;
    specialRequests?: string[];
  };
  bookingHistory?: number;
  totalSpent?: number;
}

const GuestCRUD = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      
      // Create booking statistics for each user
      const bookingStats = {};
      bookingsSnapshot.docs.forEach(doc => {
        const booking = doc.data();
        if (!bookingStats[booking.userId]) {
          bookingStats[booking.userId] = {
            count: 0,
            totalSpent: 0
          };
        }
        bookingStats[booking.userId].count++;
        bookingStats[booking.userId].totalSpent += booking.totalAmount || 0;
      });

      const guestsData = usersSnapshot.docs
        .filter(doc => doc.data().role !== 'admin')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          bookingHistory: bookingStats[doc.id]?.count || 0,
          totalSpent: bookingStats[doc.id]?.totalSpent || 0
        })) as Guest[];
      
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch guests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGuestInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getGuestLevel = (bookings: number) => {
    if (bookings >= 10) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (bookings >= 5) return { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (bookings >= 2) return { label: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Bronze', color: 'bg-orange-100 text-orange-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Guest Management</h2>
          <p className="text-muted-foreground">Manage hotel guests and profiles</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest, index) => {
          const level = getGuestLevel(guest.bookingHistory || 0);
          return (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getGuestInitials(guest.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{guest.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{guest.email}</p>
                      </div>
                    </div>
                    <Badge className={level.color}>
                      {level.label}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Total Bookings
                      </span>
                      <span className="font-medium">{guest.bookingHistory || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Total Spent
                      </span>
                      <span className="font-medium">${guest.totalSpent || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Member Since
                      </span>
                      <span className="font-medium">
                        {new Date(guest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {guest.preferences?.favoriteRoomType && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Preferred Room:</p>
                      <p className="text-sm text-muted-foreground">{guest.preferences.favoriteRoomType}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredGuests.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No guests found</h3>
            <p className="text-muted-foreground">No guests match your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GuestCRUD;
