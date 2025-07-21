import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FilterState } from '@/types';

interface RoomFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const RoomFilters: React.FC<RoomFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onToggle
}) => {
  const roomTypes = [
    'All Types',
    'Deluxe Room',
    'Ocean Suite',
    'Presidential Villa',
    'Business Executive',
    'Family Suite'
  ];

  const handleDateChange = (field: 'checkIn' | 'checkOut', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? new Date(value) : null
    });
  };

  const handleGuestsChange = (value: string) => {
    onFiltersChange({
      ...filters,
      guests: parseInt(value) || 1
    });
  };

  const handleRoomTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      roomType: value === 'All Types' ? '' : value
    });
  };

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]]
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-2xl shadow-luxury p-6 mb-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <Button
          onClick={onToggle}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>{isOpen ? 'Hide Filters' : 'Show Filters'}</span>
        </Button>
      </div>

      {/* Filters Content */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className={`${isOpen ? 'block' : 'hidden'} md:block`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Check-in Date */}
          <div className="space-y-2">
            <Label htmlFor="checkin" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Check-in</span>
            </Label>
            <Input
              id="checkin"
              type="date"
              value={formatDate(filters.checkIn)}
              onChange={(e) => handleDateChange('checkIn', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Check-out Date */}
          <div className="space-y-2">
            <Label htmlFor="checkout" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Check-out</span>
            </Label>
            <Input
              id="checkout"
              type="date"
              value={formatDate(filters.checkOut)}
              onChange={(e) => handleDateChange('checkOut', e.target.value)}
              min={filters.checkIn ? formatDate(new Date(filters.checkIn.getTime() + 24 * 60 * 60 * 1000)) : new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <Label htmlFor="guests" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Guests</span>
            </Label>
            <Select value={filters.guests.toString()} onValueChange={handleGuestsChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select guests" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Guest{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select value={filters.roomType || 'All Types'} onValueChange={handleRoomTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto">
                {roomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </Button>
          </div>
        </div>

        {/* Price Range */}
        <div className="mt-6 pt-6 border-t border-border">
          <Label className="block mb-4">
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]} per night
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={handlePriceRangeChange}
            max={1000}
            min={50}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>$50</span>
            <span>$1000+</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoomFilters;