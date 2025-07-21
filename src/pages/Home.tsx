
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, Star, Users, Calendar, Award, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Room } from '@/types';
import heroImage from '@/assets/hero-hotel.jpg';

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  imageUrl: string;
}

const Home = () => {
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [roomsRef, roomsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [offersRef, offersInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch featured rooms (limit to 3)
        const roomsQuery = query(
          collection(db, 'rooms'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const roomsSnapshot = await getDocs(roomsQuery);
        const roomsData = roomsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Room[];

        // Fetch active offers (limit to 3)
        const currentDate = new Date().toISOString().split('T')[0];
        const offersQuery = query(
          collection(db, 'offers'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const offersSnapshot = await getDocs(offersQuery);
        const offersData = offersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Offer[];

        // Filter offers that are currently valid
        const validOffers = offersData.filter(offer => {
          const validFrom = new Date(offer.validFrom);
          const validTo = new Date(offer.validTo);
          const today = new Date(currentDate);
          return today >= validFrom && today <= validTo;
        });

        setFeaturedRooms(roomsData);
        setOffers(validOffers);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const features = [
    {
      icon: Star,
      title: "5-Star Luxury",
      description: "Experience unparalleled comfort and elegance in our meticulously designed accommodations."
    },
    {
      icon: Users,
      title: "24/7 Concierge",
      description: "Our dedicated team is available around the clock to cater to your every need."
    },
    {
      icon: Calendar,
      title: "Flexible Booking",
      description: "Easy online reservations with flexible cancellation policies for your peace of mind."
    },
    {
      icon: Award,
      title: "Award Winning",
      description: "Recognized globally for exceptional hospitality and outstanding guest experiences."
    }
  ];

  const stats = [
    { number: "500+", label: "Luxury Rooms" },
    { number: "50+", label: "Countries Served" },
    { number: "4.9", label: "Guest Rating" },
    { number: "25", label: "Years Experience" }
  ];

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`;
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center text-white max-w-4xl mx-auto px-4"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="heading-luxury text-white mb-6"
          >
            Experience Luxury
            <span className="block bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
              Redefined
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed"
          >
            Discover unparalleled elegance and comfort at Anand Hotels, 
            where every moment becomes an extraordinary memory.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/rooms">
              <Button size="lg" className="btn-gold">
                Explore Rooms
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/offers">
              <Button size="lg" className="btn-elegant">
                Special Offers
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="heading-section">Why Choose Anand Hotels</h2>
            <p className="text-luxury max-w-2xl mx-auto">
              We combine luxury, comfort, and exceptional service to create unforgettable experiences 
              for our distinguished guests.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white shadow-soft hover:shadow-luxury transition-all duration-300 hover:-translate-y-2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section ref={roomsRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={roomsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="heading-section">Featured Accommodations</h2>
            <p className="text-luxury max-w-2xl mx-auto">
              Discover our handpicked selection of luxury rooms and suites, each designed to provide 
              the ultimate in comfort and sophistication.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : featuredRooms.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No rooms available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={roomsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card-luxury group cursor-pointer"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={room.images[0] || '/placeholder.svg'}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-primary">
                        From ₹{room.price}/night
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                    <p className="text-sm text-primary font-medium bg-primary/10 px-2 py-1 rounded-md inline-block mb-4">
                      {room.type}
                    </p>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{room.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Up to {room.capacity} guests</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="text-sm">4.8</span>
                      </div>
                    </div>
                    <Link to={`/rooms/${room.id}`}>
                      <Button className="w-full btn-luxury">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={roomsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link to="/rooms">
              <Button size="lg" className="btn-gold">
                View All Rooms
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Offers Section */}
      {offers.length > 0 && (
        <section ref={offersRef} className="py-20 bg-accent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={offersInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="heading-section">Special Offers</h2>
              <p className="text-luxury max-w-2xl mx-auto">
                Don't miss out on our exclusive deals and limited-time offers designed to make your stay even more memorable.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={offersInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card-luxury group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={offer.imageUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                      {formatDiscount(offer.discountType, offer.discountValue)}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3">{offer.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                      {offer.description}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Valid until {new Date(offer.validTo).toLocaleDateString('en-IN')}</span>
                    </div>
                    <Link to="/offers">
                      <Button className="w-full btn-luxury">
                        View Offer
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={offersInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link to="/offers">
                <Button size="lg" className="btn-gold">
                  View All Offers
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-luxury">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience Luxury?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Book your stay today and discover why Anand Hotels is the preferred choice 
              for discerning travelers worldwide.
            </p>
            <Link to="/rooms">
              <Button size="lg" className="btn-gold">
                Book Your Stay
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
