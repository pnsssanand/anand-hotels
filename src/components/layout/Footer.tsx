import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  Star,
  Globe,
  Heart,
  Copy,
  Check
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const developerEmail = 'pnsssanand@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(developerEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Rooms & Suites', href: '/rooms' },
    { name: 'Special Offers', href: '/offers' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const services = [
    'Luxury Accommodation',
    'Fine Dining',
    'Spa & Wellness',
    'Conference Facilities',
    'Concierge Services',
    'Airport Transfer',
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-2xl font-bold">Anand Hotels</h3>
            </div>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              Experience luxury and comfort at its finest. We provide world-class 
              hospitality with personalized service that exceeds expectations.
            </p>
            
            {/* Rating */}
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                ))}
              </div>
              <span className="text-sm text-primary-foreground/80">4.9/5 (2,450 reviews)</span>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-secondary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold mb-6">Our Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service} className="text-primary-foreground/80">
                  {service}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold mb-6">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                <div>
                  <p className="text-primary-foreground/80">
                    123 Luxury Avenue,<br />
                    Paradise City, PC 12345<br />
                    United States
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-secondary" />
                <a 
                  href="tel:+1-555-123-4567" 
                  className="text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  +1 (555) 123-4567
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-secondary" />
                <a 
                  href="mailto:info@anandhotels.com" 
                  className="text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  info@anandhotels.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Developer Credits Section */}
        <div className="border-t border-white/20 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-secondary-foreground font-bold text-lg">AH</span>
                </div>
                <h3 className="text-xl font-bold">Anand Hotels</h3>
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                Luxury hospitality redefined. Experience world-class 
                comfort and personalized service.
              </p>
            </motion.div>

            {/* Developer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <p className="text-primary-foreground/80 text-sm mb-2">
                Designed & Developed with <Heart className="inline w-4 h-4 text-red-500 fill-red-500 mx-1" /> by
              </p>
              <h4 className="text-xl font-bold text-white mb-1">Mr. Anand Pinisetty</h4>
              <p className="text-secondary text-sm mb-4">Full Stack Developer</p>
              <motion.a
                href="https://portfolio-anand-one.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-primary-foreground/30 rounded-full text-sm hover:bg-white/10 transition-all duration-300"
              >
                <Globe className="w-4 h-4" />
                <span>View Developer Portfolio</span>
              </motion.a>
            </motion.div>

            {/* Connect with Developer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center md:text-right"
            >
              <p className="text-primary-foreground/80 text-sm mb-4">Connect with the developer</p>
              <div className="flex justify-center md:justify-end space-x-3">
                <motion.a
                  href="https://github.com/pnsssanand"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                  aria-label="GitHub"
                >
                  <FaGithub className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="https://www.linkedin.com/in/pinisetty-naga-satya-surya-shiva-anand-087351389/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
                <motion.button
                  onClick={() => setEmailDialogOpen(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-foreground/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Anand Hotels. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-primary-foreground/60 text-sm mb-4 md:mb-0">
              <span className="px-3 py-1 border border-primary-foreground/20 rounded-full">
                {'</>'} Built with React, TypeScript & Firebase
              </span>
            </div>
            <div className="flex space-x-6">
              <Link 
                to="/privacy" 
                className="text-primary-foreground/60 hover:text-secondary text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="text-primary-foreground/60 hover:text-secondary text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="text-primary-foreground/60 hover:text-secondary text-sm transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-primary-foreground/50 text-xs">
              v1.0.0 • Crafted with precision by Anand Pinisetty
            </p>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-primary" />
              <span>Developer Contact</span>
            </DialogTitle>
            <DialogDescription>
              Get in touch with the developer via email
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">{developerEmail}</p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Click below to copy the email address or send an email directly
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCopyEmail}
                className="flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Email</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.location.href = `mailto:${developerEmail}`}
                className="flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;