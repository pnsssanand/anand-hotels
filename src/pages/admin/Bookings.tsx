import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Search, Filter, Eye, Edit, Trash2, Plus,
  User, Phone, Mail, MapPin, CreditCard, Clock,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays } from 'date-fns';

interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  roomId: string;
  roomName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  bookingStatus: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'checked-out' | 'no-show';
  specialRequests?: string;
  addOns?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
}

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    specialRequests: '',
    bookingStatus: 'confirmed' as Booking['bookingStatus'],
    paymentStatus: 'pending' as Booking['paymentStatus'],
    amountPaid: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchRooms()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          
          // Get user details
          const userSnapshot = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', data.userId))
          );
          const userData = userSnapshot.docs[0]?.data();

          return {
            id: bookingDoc.id,
            roomName: roomData?.name || 'Unknown Room',
            roomType: roomData?.type || 'Unknown Type',
            userName: userData?.displayName || data.userName || 'Unknown User',
            userEmail: userData?.email || data.userEmail || 'Unknown Email',
            userPhone: userData?.phone || data.userPhone,
            ...data
          } as Booking;
        })
      );
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['bookingStatus']) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        bookingStatus: status,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Booking status updated successfully"
      });
      
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  const updatePaymentStatus = async (bookingId: string, status: Booking['paymentStatus'], amountPaid: number) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentStatus: status,
        amountPaid,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Payment status updated successfully"
      });
      
      fetchBookings();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const nights = differenceInDays(new Date(editForm.checkOutDate), new Date(editForm.checkInDate));
      const room = rooms.find(r => r.id === selectedBooking.roomId);
      const totalAmount = nights * (room?.pricePerNight || 0);

      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        ...editForm,
        totalAmount,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Booking updated successfully"
      });

      setIsEditDialogOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (booking: Booking) => {
    if (!confirm(`Are you sure you want to delete booking for ${booking.userName}?`)) return;

    try {
      await deleteDoc(doc(db, 'bookings', booking.id));
      
      toast({
        title: "Success",
        description: "Booking deleted successfully"
      });
      
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'checked-in': return 'bg-blue-100 text-blue-800';
      case 'checked-out': return 'bg-purple-100 text-purple-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'no-show':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
      case 'partial':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.bookingStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      matchesDate = booking.checkInDate === today;
    } else if (dateFilter === 'upcoming') {
      matchesDate = new Date(booking.checkInDate) > new Date();
    } else if (dateFilter === 'past') {
      matchesDate = new Date(booking.checkOutDate) < new Date();
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed').length;
  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingPayments = bookings.filter(b => b.paymentStatus === 'pending' || b.paymentStatus === 'partial').length;

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
          <h1 className="text-3xl font-bold">Bookings Management</h1>
          <p className="text-muted-foreground">Manage room bookings and reservations</p>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{confirmedBookings}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">{pendingPayments}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Booking Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Filter</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold">{booking.userName}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {booking.userEmail}
                      </p>
                      {booking.userPhone && (
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {booking.userPhone}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold">{booking.roomName}</h4>
                      <p className="text-sm text-muted-foreground">{booking.roomType}</p>
                      <p className="text-sm text-muted-foreground">{booking.guests} guest(s)</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {format(parseISO(booking.checkInDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="text-sm font-medium mt-1">
                        {format(parseISO(booking.checkOutDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">Check-out</p>
                    </div>

                    <div>
                      <p className="text-lg font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                      {booking.paymentStatus === 'partial' && (
                        <p className="text-sm text-muted-foreground">
                          Paid: ₹{booking.amountPaid.toLocaleString()}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge className={getStatusColor(booking.bookingStatus)}>
                          {getStatusIcon(booking.bookingStatus)}
                          <span className="ml-1">{booking.bookingStatus}</span>
                        </Badge>
                        <Badge className={getStatusColor(booking.paymentStatus)}>
                          {getStatusIcon(booking.paymentStatus)}
                          <span className="ml-1">{booking.paymentStatus}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setEditForm({
                          checkInDate: booking.checkInDate,
                          checkOutDate: booking.checkOutDate,
                          guests: booking.guests,
                          specialRequests: booking.specialRequests || '',
                          bookingStatus: booking.bookingStatus,
                          paymentStatus: booking.paymentStatus,
                          amountPaid: booking.amountPaid
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {/* Quick Actions */}
                    {booking.bookingStatus === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'checked-in')}
                      >
                        Check In
                      </Button>
                    )}
                    {booking.bookingStatus === 'checked-in' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingStatus(booking.id, 'checked-out')}
                      >
                        Check Out
                      </Button>
                    )}
                    {booking.paymentStatus === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updatePaymentStatus(booking.id, 'paid', booking.totalAmount)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Guest Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedBooking.userName}</p>
                    <p><span className="font-medium">Email:</span> {selectedBooking.userEmail}</p>
                    {selectedBooking.userPhone && (
                      <p><span className="font-medium">Phone:</span> {selectedBooking.userPhone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Booking Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Room:</span> {selectedBooking.roomName}</p>
                    <p><span className="font-medium">Type:</span> {selectedBooking.roomType}</p>
                    <p><span className="font-medium">Guests:</span> {selectedBooking.guests}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Dates</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Check-in:</span> {format(parseISO(selectedBooking.checkInDate), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">Check-out:</span> {format(parseISO(selectedBooking.checkOutDate), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">Nights:</span> {differenceInDays(parseISO(selectedBooking.checkOutDate), parseISO(selectedBooking.checkInDate))}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Payment</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Total:</span> ₹{selectedBooking.totalAmount.toLocaleString()}</p>
                    <p><span className="font-medium">Paid:</span> ₹{selectedBooking.amountPaid.toLocaleString()}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedBooking.paymentStatus)}`}>
                        {selectedBooking.paymentStatus}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div>
                  <h3 className="font-semibold mb-3">Special Requests</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedBooking.specialRequests}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Badge className={getStatusColor(selectedBooking.bookingStatus)}>
                  {selectedBooking.bookingStatus}
                </Badge>
                <Badge className={getStatusColor(selectedBooking.paymentStatus)}>
                  {selectedBooking.paymentStatus}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check-in Date</Label>
                <Input
                  type="date"
                  value={editForm.checkInDate}
                  onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Check-out Date</Label>
                <Input
                  type="date"
                  value={editForm.checkOutDate}
                  onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Number of Guests</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={editForm.guests}
                onChange={(e) => setEditForm({ ...editForm, guests: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Booking Status</Label>
                <Select value={editForm.bookingStatus} onValueChange={(value: any) => 
                  setEditForm({ ...editForm, bookingStatus: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={editForm.paymentStatus} onValueChange={(value: any) => 
                  setEditForm({ ...editForm, paymentStatus: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editForm.paymentStatus === 'partial' && (
              <div>
                <Label>Amount Paid</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amountPaid}
                  onChange={(e) => setEditForm({ ...editForm, amountPaid: parseFloat(e.target.value) })}
                  required
                />
              </div>
            )}

            <div>
              <Label>Special Requests</Label>
              <Textarea
                value={editForm.specialRequests}
                onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                placeholder="Special requests or notes"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
          <p className="text-muted-foreground">No bookings match your current filters</p>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
