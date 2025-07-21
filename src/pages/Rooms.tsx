
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, FilterState } from '@/types';
import RoomCard from '@/components/rooms/RoomCard';
import RoomFilters from '@/components/rooms/RoomFilters';
import { Loader2, Search } from 'lucide-react';

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    checkIn: null,
    checkOut: null,
    guests: 2,
    roomType: '',
    priceRange: [50, 1000]
  });

  const [headerRef, headerInView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const roomsQuery = query(
          collection(db, 'rooms'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(roomsQuery);
        const roomsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Room[];
        
        setRooms(roomsData);
        setFilteredRooms(roomsData);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rooms, filters]);

  const applyFilters = () => {
    let filtered = [...rooms];

    // Filter by room type
    if (filters.roomType) {
      filtered = filtered.filter(room => room.type === filters.roomType);
    }

    // Filter by capacity
    filtered = filtered.filter(room => room.capacity >= filters.guests);

    // Filter by price range
    filtered = filtered.filter(room => 
      room.price >= filters.priceRange[0] && room.price <= filters.priceRange[1]
    );

    // Filter by availability (if dates are selected)
    if (filters.checkIn && filters.checkOut) {
      // In a real app, this would check actual availability
      filtered = filtered.filter(room => room.availability);
    }

    setFilteredRooms(filtered);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      checkIn: null,
      checkOut: null,
      guests: 2,
      roomType: '',
      priceRange: [50, 1000]
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section ref={headerRef} className="bg-gradient-to-r from-primary to-primary-light text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Luxury Rooms & Suites
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Discover our collection of elegantly appointed accommodations, 
              each designed to provide the ultimate in comfort and sophistication.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <RoomFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Search className="w-5 h-5" />
            <span>
              {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room, index) => (
              <RoomCard key={room.id} room={room} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-4">No rooms found</h3>
            <p className="text-muted-foreground mb-8">
              {rooms.length === 0 
                ? "No rooms have been added yet. Please check back later."
                : "Try adjusting your filters to find more options."
              }
            </p>
            {rooms.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="btn-luxury"
              >
                Clear All Filters
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
