
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Calendar, Users, Star, ArrowRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
  createdAt: string;
}

const Offers = () => {
  const [headerRef, headerInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [offersRef, offersInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  const fetchActiveOffers = async () => {
    try {
      setLoading(true);
      const currentDate = new Date().toISOString().split('T')[0];
      
      const offersQuery = query(
        collection(db, 'offers'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const offersSnapshot = await getDocs(offersQuery);
      const offersData = offersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Offer));

      // Filter offers that are currently valid
      const validOffers = offersData.filter(offer => {
        const validFrom = new Date(offer.validFrom);
        const validTo = new Date(offer.validTo);
        const today = new Date(currentDate);
        return today >= validFrom && today <= validTo;
      });

      setOffers(validOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section ref={headerRef} className="bg-gradient-to-r from-secondary-dark to-secondary text-secondary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Special Offers & Packages
            </h1>
            <p className="text-xl text-secondary-foreground/90 max-w-2xl mx-auto">
              Discover exclusive deals and curated packages designed to enhance your luxury experience 
              at Anand Hotels with exceptional value.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Offers Grid */}
      <section ref={offersRef} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {offers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={offersInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4">No Active Offers</h3>
              <p className="text-muted-foreground mb-8">
                We're working on some amazing deals for you. Check back soon!
              </p>
              <Link to="/rooms">
                <Button className="btn-luxury">
                  Explore Our Rooms
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={offersInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card-luxury group"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={offer.imageUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Discount Badge */}
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                      {formatDiscount(offer.discountType, offer.discountValue)}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3">{offer.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {offer.description}
                    </p>

                    {/* Validity */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Valid until {new Date(offer.validTo).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link to="/rooms">
                      <Button className="w-full" variant="luxury">
                        Book This Offer
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Can't Find the Perfect Package?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Our concierge team can create a custom package tailored to your specific needs and preferences.
            </p>
            <Link to="/contact">
              <Button size="lg" variant="gold">
                Contact Our Concierge
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Offers;
