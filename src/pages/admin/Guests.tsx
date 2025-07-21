import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Filter, Eye, Edit, Users, Phone, Mail, MapPin, 
  Calendar, Star, Award, Gift, History, Settings
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface Guest {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  nationality?: string;
  preferences?: {
    favoriteRoomType?: string;
    specialRequests?: string[];
    dietaryRestrictions?: string;
    bedPreference?: string;
  };
  loyaltyStatus: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalBookings: number;
  totalSpent: number;
  lastStayDate?: string;
  joinDate: string;
  isVIP: boolean;
  notes?: string;
}

interface Booking {
  id: string;
  userId: string;
  roomName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
}

const GuestsPage = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestBookings, setGuestBookings] = useState<{ [key: string]: Booking[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loyaltyFilter, setLoyaltyFilter] = useState<string>('all');
  const [vipFilter, setVipFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    nationality: '',
    favoriteRoomType: '',
    specialRequests: '',
    dietaryRestrictions: '',
    bedPreference: '',
    loyaltyStatus: 'bronze' as Guest['loyaltyStatus'],
    isVIP: false,
    notes: ''
  });

  useEffect(() => {
    fetchGuestsData();
  }, []);

  const fetchGuestsData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchGuests(), fetchBookings()]);
    } catch (error) {
      console.error('Error fetching guests data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'user'), orderBy('joinDate', 'desc'))
      );
      
      const guestsData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          joinDate: data.createdAt || new Date().toISOString(),
          loyaltyStatus: data.loyaltyStatus || 'bronze',
          totalBookings: data.totalBookings || 0,
          totalSpent: data.totalSpent || 0,
          isVIP: data.isVIP || false,
          ...data
        } as Guest;
      });
      
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const bookingsSnapshot = await getDocs(
        query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      );
      
      const bookingsData = await Promise.all(
        bookingsSnapshot.docs.map(async (bookingDoc) => {
          const data = bookingDoc.data();
          
          // Get room details
          const roomSnapshot = await getDocs(
            query(collection(db, 'rooms'), where('__name__', '==', data.roomId))
          );
          const roomData = roomSnapshot.docs[0]?.data();
          
          return {
            id: bookingDoc.id,
            roomName: roomData?.name || 'Unknown Room',
            roomType: roomData?.type || 'Unknown Type',
            ...data
          } as Booking;
        })
      );

      // Group bookings by user ID
      const groupedBookings = bookingsData.reduce((acc, booking) => {
        if (!acc[booking.userId]) {
          acc[booking.userId] = [];
        }
        acc[booking.userId].push(booking);
        return acc;
      }, {} as { [key: string]: Booking[] });

      setGuestBookings(groupedBookings);

      // Update guest statistics
      const updatedGuests = guests.map(guest => {
        const userBookings = groupedBookings[guest.id] || [];
        const completedBookings = userBookings.filter(b => b.paymentStatus === 'paid');
        
        return {
          ...guest,
          totalBookings: userBookings.length,
          totalSpent: completedBookings.reduce((sum, b) => sum + b.totalAmount, 0),
          lastStayDate: userBookings.length > 0 ? userBookings[0].checkOutDate : undefined
        };
      });

      setGuests(updatedGuests);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const updateGuestLoyaltyStatus = (guest: Guest): Guest['loyaltyStatus'] => {
    if (guest.totalSpent >= 100000) return 'platinum';
    if (guest.totalSpent >= 50000) return 'gold';
    if (guest.totalSpent >= 20000) return 'silver';
    return 'bronze';
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    try {
      const updatedData = {
        ...editForm,
        preferences: {
          favoriteRoomType: editForm.favoriteRoomType,
          specialRequests: editForm.specialRequests.split(',').map(s => s.trim()).filter(s => s),
          dietaryRestrictions: editForm.dietaryRestrictions,
          bedPreference: editForm.bedPreference
        },
        loyaltyStatus: updateGuestLoyaltyStatus({
          ...selectedGuest,
          totalSpent: selectedGuest.totalSpent
        })
      };

      await updateDoc(doc(db, 'users', selectedGuest.id), updatedData);

      toast({
        title: "Success",
        description: "Guest profile updated successfully"
      });

      setIsEditDialogOpen(false);
      setSelectedGuest(null);
      fetchGuestsData();
    } catch (error) {
      console.error('Error updating guest:', error);
      toast({
        title: "Error",
        description: "Failed to update guest profile",
        variant: "destructive"
      });
    }
  };

  const getLoyaltyColor = (status: string) => {
    switch (status) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoyaltyIcon = (status: string) => {
    switch (status) {
      case 'platinum': return <Award className="w-4 h-4" />;
      case 'gold': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guest.phone && guest.phone.includes(searchTerm));
    
    const matchesLoyalty = loyaltyFilter === 'all' || guest.loyaltyStatus === loyaltyFilter;
    const matchesVIP = vipFilter === 'all' || 
                      (vipFilter === 'vip' && guest.isVIP) ||
                      (vipFilter === 'regular' && !guest.isVIP);
    
    return matchesSearch && matchesLoyalty && matchesVIP;
  });

  // Statistics
  const totalGuests = guests.length;
  const vipGuests = guests.filter(g => g.isVIP).length;
  const averageSpent = guests.length > 0 ? guests.reduce((sum, g) => sum + g.totalSpent, 0) / guests.length : 0;
  const repeatGuests = guests.filter(g => g.totalBookings > 1).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
          <h1 className="text-3xl font-bold">Guest Management</h1>
          <p className="text-muted-foreground">Manage guest profiles and preferences</p>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{totalGuests}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VIP Guests</p>
                <p className="text-2xl font-bold text-purple-600">{vipGuests}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Spent</p>
                <p className="text-2xl font-bold text-green-600">₹{averageSpent.toFixed(0)}</p>
              </div>
              <Gift className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Repeat Guests</p>
                <p className="text-2xl font-bold text-orange-600">{repeatGuests}</p>
              </div>
              <History className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Guests</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Loyalty Status</Label>
              <select
                value={loyaltyFilter}
                onChange={(e) => setLoyaltyFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Loyalty Levels</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div>
              <Label>Guest Type</Label>
              <select
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Guests</option>
                <option value="vip">VIP Guests</option>
                <option value="regular">Regular Guests</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest, index) => (
          <motion.div
            key={guest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${guest.displayName}`} />
                      <AvatarFallback>
                        {guest.displayName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold flex items-center">
                        {guest.displayName}
                        {guest.isVIP && <Award className="w-4 h-4 ml-2 text-purple-600" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">{guest.email}</p>
                    </div>
                  </div>
                  <Badge className={getLoyaltyColor(guest.loyaltyStatus)}>
                    {getLoyaltyIcon(guest.loyaltyStatus)}
                    <span className={getLoyaltyIcon(guest.loyaltyStatus) ? "ml-1" : ""}>
                      {guest.loyaltyStatus}
                    </span>
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {guest.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 mr-2" />
                      {guest.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined {format(parseISO(guest.joinDate), 'MMM yyyy')}
                  </div>
                  {guest.lastStayDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <History className="w-4 h-4 mr-2" />
                      Last stay: {format(parseISO(guest.lastStayDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{guest.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">₹{guest.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedGuest(guest);
                      setIsViewDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedGuest(guest);
                      setEditForm({
                        displayName: guest.displayName,
                        phone: guest.phone || '',
                        address: guest.address || '',
                        dateOfBirth: guest.dateOfBirth || '',
                        nationality: guest.nationality || '',
                        favoriteRoomType: guest.preferences?.favoriteRoomType || '',
                        specialRequests: guest.preferences?.specialRequests?.join(', ') || '',
                        dietaryRestrictions: guest.preferences?.dietaryRestrictions || '',
                        bedPreference: guest.preferences?.bedPreference || '',
                        loyaltyStatus: guest.loyaltyStatus,
                        isVIP: guest.isVIP,
                        notes: guest.notes || ''
                      });
                      setIsEditDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View Guest Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Guest Profile</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="bookings">Booking History</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedGuest.displayName}</p>
                      <p><span className="font-medium">Email:</span> {selectedGuest.email}</p>
                      {selectedGuest.phone && (
                        <p><span className="font-medium">Phone:</span> {selectedGuest.phone}</p>
                      )}
                      {selectedGuest.dateOfBirth && (
                        <p><span className="font-medium">Date of Birth:</span> {format(parseISO(selectedGuest.dateOfBirth), 'MMM dd, yyyy')}</p>
                      )}
                      {selectedGuest.nationality && (
                        <p><span className="font-medium">Nationality:</span> {selectedGuest.nationality}</p>
                      )}
                      {selectedGuest.address && (
                        <p><span className="font-medium">Address:</span> {selectedGuest.address}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Guest Status</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Loyalty Status:</span> 
                        <Badge className={`ml-2 ${getLoyaltyColor(selectedGuest.loyaltyStatus)}`}>
                          {selectedGuest.loyaltyStatus}
                        </Badge>
                      </p>
                      <p><span className="font-medium">VIP Status:</span> {selectedGuest.isVIP ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Join Date:</span> {format(parseISO(selectedGuest.joinDate), 'MMM dd, yyyy')}</p>
                      <p><span className="font-medium">Total Bookings:</span> {selectedGuest.totalBookings}</p>
                      <p><span className="font-medium">Total Spent:</span> ₹{selectedGuest.totalSpent.toLocaleString()}</p>
                      {selectedGuest.lastStayDate && (
                        <p><span className="font-medium">Last Stay:</span> {format(parseISO(selectedGuest.lastStayDate), 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedGuest.notes && (
                  <div>
                    <h3 className="font-semibold mb-3">Notes</h3>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedGuest.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bookings">
                <div className="space-y-4">
                  <h3 className="font-semibold">Booking History</h3>
                  {guestBookings[selectedGuest.id]?.map((booking, index) => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{booking.roomName}</h4>
                            <p className="text-sm text-muted-foreground">{booking.roomType}</p>
                            <p className="text-sm">
                              {format(parseISO(booking.checkInDate), 'MMM dd')} - {format(parseISO(booking.checkOutDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{booking.totalAmount.toLocaleString()}</p>
                            <Badge className={`mt-1`}>
                              {booking.bookingStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <p className="text-muted-foreground">No bookings found</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preferences">
                <div className="space-y-4">
                  <h3 className="font-semibold">Guest Preferences</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p><span className="font-medium">Favorite Room Type:</span> {selectedGuest.preferences?.favoriteRoomType || 'Not specified'}</p>
                      <p><span className="font-medium">Bed Preference:</span> {selectedGuest.preferences?.bedPreference || 'Not specified'}</p>
                      <p><span className="font-medium">Dietary Restrictions:</span> {selectedGuest.preferences?.dietaryRestrictions || 'None'}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Special Requests:</span></p>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {selectedGuest.preferences?.specialRequests?.map((request, idx) => (
                          <li key={idx}>{request}</li>
                        )) || <li>None</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Guest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Guest Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Name</Label>
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>Nationality</Label>
                <Input
                  value={editForm.nationality}
                  onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Favorite Room Type</Label>
              <Input
                value={editForm.favoriteRoomType}
                onChange={(e) => setEditForm({ ...editForm, favoriteRoomType: e.target.value })}
                placeholder="e.g., Suite, Deluxe, Standard"
              />
            </div>

            <div>
              <Label>Special Requests (comma-separated)</Label>
              <Input
                value={editForm.specialRequests}
                onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                placeholder="e.g., High floor, Away from elevator"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dietary Restrictions</Label>
                <Input
                  value={editForm.dietaryRestrictions}
                  onChange={(e) => setEditForm({ ...editForm, dietaryRestrictions: e.target.value })}
                />
              </div>
              <div>
                <Label>Bed Preference</Label>
                <Input
                  value={editForm.bedPreference}
                  onChange={(e) => setEditForm({ ...editForm, bedPreference: e.target.value })}
                  placeholder="e.g., King, Twin, Queen"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loyalty Status</Label>
                <select
                  value={editForm.loyaltyStatus}
                  onChange={(e) => setEditForm({ ...editForm, loyaltyStatus: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVIP"
                  checked={editForm.isVIP}
                  onChange={(e) => setEditForm({ ...editForm, isVIP: e.target.checked })}
                />
                <Label htmlFor="isVIP">VIP Guest</Label>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes about the guest"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Guest
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Guests Found</h3>
          <p className="text-muted-foreground">No guests match your current filters</p>
        </div>
      )}
    </div>
  );
};

export default GuestsPage;
