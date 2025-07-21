
export interface Room {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  images: string[];
  amenities: string[];
  availability: boolean;
  features: {
    bedType: string;
    bathrooms: number;
    hasBalcony: boolean;
    hasOceanView: boolean;
    hasKitchen: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  addOns: BookingAddOn[];
  specialRequests?: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  imageUrl: string;
  createdAt: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  preferences?: {
    favoriteRoomType?: string;
    specialRequests?: string[];
  };
  createdAt: string;
}

export interface FilterState {
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  roomType: string;
  priceRange: [number, number];
}

export interface CartItem {
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  addOns: BookingAddOn[];
  totalPrice: number;
}
