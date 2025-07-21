
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Bed, Star, ArrowLeft, Plus, Minus } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Room, BookingAddOn } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [selectedAddOns, setSelectedAddOns] = useState<BookingAddOn[]>([]);

  const availableAddOns: BookingAddOn[] = [
    { id: '1', name: 'Continental Breakfast', price: 25, quantity: 0 },
    { id: '2', name: 'Spa Package', price: 75, quantity: 0 },
    { id: '3', name: 'Airport Transfer', price: 50, quantity: 0 },
    { id: '4', name: 'Late Checkout', price: 30, quantity: 0 },
  ];

  useEffect(() => {
    const fetchRoom = async () => {
      if (!id) return;
      
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', id));
        if (roomDoc.exists()) {
          setRoom({ id: roomDoc.id, ...roomDoc.data() } as Room);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const handleAddOnChange = (addOnId: string, increment: boolean) => {
    setSelectedAddOns(prev => {
      const existing = prev.find(a => a.id === addOnId);
      const baseAddOn = availableAddOns.find(a => a.id === addOnId)!;
      
      if (!existing && increment) {
        return [...prev, { ...baseAddOn, quantity: 1 }];
      }
      
      return prev.map(addOn => {
        if (addOn.id === addOnId) {
          const newQuantity = increment ? addOn.quantity + 1 : Math.max(0, addOn.quantity - 1);
          return newQuantity > 0 ? { ...addOn, quantity: newQuantity } : null;
        }
        return addOn;
      }).filter(Boolean) as BookingAddOn[];
    });
  };

  const calculateTotal = () => {
    if (!room || !checkIn || !checkOut) return 0;
    
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const roomTotal = room.price * nights;
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + (addOn.price * addOn.quantity), 0);
    
    return roomTotal + addOnsTotal;
  };

  const handleBooking = () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to make a booking",
        variant: "destructive"
      });
      return;
    }

    if (!checkIn || !checkOut) {
      toast({
        title: "Select Dates",
        description: "Please select check-in and check-out dates",
        variant: "destructive"
      });
      return;
    }

    // Store booking data in localStorage and redirect to booking confirmation
    const bookingData = {
      roomId: room?.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests,
      addOns: selectedAddOns,
      totalAmount: calculateTotal()
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    toast({
      title: "Booking Initiated",
      description: "Redirecting to booking confirmation...",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
          <Link to="/rooms" className="btn-luxury">
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link to="/rooms" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-video rounded-2xl overflow-hidden"
            >
              <img
                src={room.images[selectedImage]}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            <div className="grid grid-cols-4 gap-2">
              {room.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${room.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Room Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
              <p className="text-lg text-primary font-medium bg-primary/10 px-3 py-1 rounded-md inline-block mb-4">
                {room.type}
              </p>
              <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Up to {room.capacity} guests</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bed className="w-4 h-4" />
                  <span>{room.features.bedType}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-secondary text-secondary" />
                  <span>4.8</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{room.description}</p>
            </div>

            {/* Price */}
            <div className="bg-accent rounded-2xl p-6">
              <div className="text-3xl font-bold text-primary mb-2">
                ${room.price}<span className="text-lg text-muted-foreground">/night</span>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-2xl p-6 shadow-luxury">
              <h3 className="text-xl font-semibold mb-4">Book Your Stay</h3>
              
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Check-in</label>
                  <CalendarComponent
                    mode="single"
                    selected={checkIn || undefined}
                    onSelect={(date) => setCheckIn(date || null)}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Check-out</label>
                  <CalendarComponent
                    mode="single"
                    selected={checkOut || undefined}
                    onSelect={(date) => setCheckOut(date || null)}
                    disabled={(date) => date <= (checkIn || new Date())}
                    className="rounded-md border"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md"
                >
                  {Array.from({ length: room.capacity }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Add-ons */}
              <div className="mb-6">
                <h4 className="font-medium mb-4">Add-ons & Services</h4>
                <div className="space-y-3">
                  {availableAddOns.map(addOn => {
                    const selected = selectedAddOns.find(s => s.id === addOn.id);
                    const quantity = selected?.quantity || 0;
                    
                    return (
                      <div key={addOn.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{addOn.name}</div>
                          <div className="text-sm text-muted-foreground">${addOn.price}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOnChange(addOn.id, false)}
                            disabled={quantity === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOnChange(addOn.id, true)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              {checkIn && checkOut && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full btn-luxury"
                onClick={handleBooking}
                disabled={!checkIn || !checkOut}
              >
                Book Now
              </Button>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {room.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-accent rounded-lg">
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
