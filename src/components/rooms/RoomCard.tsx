import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Bed, Wifi, Coffee, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  index?: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, index = 0 }) => {
  const amenityIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'WiFi': Wifi,
    'Coffee': Coffee,
    'Parking': Car,
    'Room Service': Star,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="card-luxury group"
    >
      {/* Image Gallery */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={room.images[0]}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-soft">
          <span className="text-lg font-bold text-primary">${room.price}</span>
          <span className="text-sm text-muted-foreground">/night</span>
        </div>

        {/* Availability Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
          room.availability 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {room.availability ? 'Available' : 'Booked'}
        </div>

        {/* Image Counter */}
        {room.images.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            1 / {room.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-foreground">{room.name}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              <span className="text-sm font-medium">4.8</span>
            </div>
          </div>
          <p className="text-sm text-primary font-medium bg-primary/10 px-2 py-1 rounded-md inline-block">
            {room.type}
          </p>
        </div>

        {/* Room Features */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Up to {room.capacity} guests</span>
          </div>
          <div className="flex items-center space-x-2">
            <Bed className="w-4 h-4" />
            <span>{room.features.bedType}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 text-center">📐</span>
            <span>{room.size} sqft</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 text-center">🚿</span>
            <span>{room.features.bathrooms} bathroom{room.features.bathrooms > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 4).map((amenity) => {
              const IconComponent = amenityIcons[amenity];
              return (
                <div
                  key={amenity}
                  className="flex items-center space-x-1 bg-accent px-2 py-1 rounded-md text-xs"
                >
                  {IconComponent && <IconComponent className="w-3 h-3" />}
                  <span>{amenity}</span>
                </div>
              );
            })}
            {room.amenities.length > 4 && (
              <div className="bg-muted px-2 py-1 rounded-md text-xs text-muted-foreground">
                +{room.amenities.length - 4} more
              </div>
            )}
          </div>
        </div>

        {/* Special Features */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 text-xs">
            {room.features.hasOceanView && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                🌊 Ocean View
              </span>
            )}
            {room.features.hasBalcony && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
                🏢 Private Balcony
              </span>
            )}
            {room.features.hasKitchen && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md">
                🍳 Kitchenette
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
          {room.description}
        </p>

        {/* Actions */}
        <div className="flex space-x-3">
          <Link to={`/rooms/${room.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {room.availability && (
            <Link to={`/booking/${room.id}`} className="flex-1">
              <Button className="w-full btn-luxury">
                Book Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;