import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Award, Users, Clock, Globe, Star, Heart } from 'lucide-react';

const About = () => {
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [storyRef, storyInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [valuesRef, valuesInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [teamRef, teamInView] = useInView({ threshold: 0.1, triggerOnce: true });

  const values = [
    {
      icon: Star,
      title: 'Excellence',
      description: 'We strive for perfection in every detail, ensuring exceptional experiences that exceed expectations.'
    },
    {
      icon: Heart,
      title: 'Hospitality',
      description: 'Genuine warmth and personalized service are at the heart of everything we do.'
    },
    {
      icon: Globe,
      title: 'Sustainability',
      description: 'We are committed to responsible luxury that respects and preserves our environment.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building meaningful connections with our guests, team, and local communities.'
    }
  ];

  const achievements = [
    { number: '25+', label: 'Years of Excellence' },
    { number: '500K+', label: 'Happy Guests' },
    { number: '50+', label: 'Awards Won' },
    { number: '4.9/5', label: 'Guest Rating' }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'General Manager',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=400&q=80',
      description: 'With over 15 years in luxury hospitality, Sarah leads our team with passion and dedication.'
    },
    {
      name: 'Michael Chen',
      role: 'Executive Chef',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      description: 'Michelin-trained chef bringing innovative culinary experiences to our guests.'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Spa Director',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      description: 'Wellness expert dedicated to creating transformative spa and wellness experiences.'
    },
    {
      name: 'David Thompson',
      role: 'Guest Relations Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      description: 'Ensuring every guest feels valued and experiences our signature personalized service.'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative h-[70vh] flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center text-white max-w-4xl mx-auto px-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our Story of Excellence
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed">
            For over two decades, Anand Hotels has been synonymous with luxury, 
            elegance, and unparalleled hospitality experiences.
          </p>
        </motion.div>
      </section>

      {/* Story Section */}
      <section ref={storyRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                A Legacy of Luxury
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Founded in 1999 by visionary hotelier Rajesh Anand, Anand Hotels began as a 
                dream to create the perfect blend of traditional hospitality and modern luxury. 
                What started as a single boutique property has grown into a collection of 
                prestigious hotels known worldwide for exceptional service.
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Our commitment to excellence has earned us recognition from leading travel 
                publications and countless awards. But our greatest achievement is the 
                smile on our guests' faces and the memories they create with us.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Today, we continue to innovate and evolve while staying true to our core 
                values of exceptional service, attention to detail, and creating unforgettable 
                experiences for every guest who walks through our doors.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
                alt="Hotel interior"
                className="rounded-2xl shadow-luxury"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-luxury">
                <div className="text-3xl font-bold text-primary">25+</div>
                <div className="text-sm text-muted-foreground">Years of Excellence</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                  {achievement.number}
                </div>
                <div className="text-lg text-white/80">{achievement.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className="py-20 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Our Core Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do and define who we are as a hospitality leader.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-2xl shadow-soft hover:shadow-luxury transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Meet Our Leadership Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our experienced leaders are passionate about delivering exceptional experiences 
              and maintaining our reputation for excellence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;