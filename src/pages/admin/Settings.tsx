import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, User, Building, CreditCard, Bell, 
  Globe, Shield, Upload, Save, Eye, EyeOff,
  Mail, Phone, MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface HotelSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  currency: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  serviceFee: number;
  cancellationPolicy: string;
  termsAndConditions: string;
}

interface AdminProfile {
  displayName: string;
  email: string;
  phone: string;
  role: string;
  photoURL: string;
}

interface NotificationSettings {
  emailBookings: boolean;
  emailPayments: boolean;
  emailGuests: boolean;
  emailPromotions: boolean;
  smsBookings: boolean;
  smsPayments: boolean;
  pushNotifications: boolean;
}

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'hotel' | 'notifications' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<AdminProfile>({
    displayName: '',
    email: '',
    phone: '',
    role: 'admin',
    photoURL: ''
  });

  // Hotel settings state
  const [hotelSettings, setHotelSettings] = useState<HotelSettings>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    taxRate: 18,
    serviceFee: 10,
    cancellationPolicy: '',
    termsAndConditions: ''
  });

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailBookings: true,
    emailPayments: true,
    emailGuests: true,
    emailPromotions: false,
    smsBookings: true,
    smsPayments: true,
    pushNotifications: true
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load profile data
      setProfile({
        displayName: currentUser?.displayName || '',
        email: currentUser?.email || '',
        phone: '',
        role: 'admin',
        photoURL: currentUser?.photoURL || ''
      });

      // Load hotel settings
      const hotelDoc = await getDoc(doc(db, 'settings', 'hotel'));
      if (hotelDoc.exists()) {
        setHotelSettings({ ...hotelSettings, ...hotelDoc.data() });
      }

      // Load notification settings
      const notificationDoc = await getDoc(doc(db, 'settings', `notifications_${currentUser?.uid}`));
      if (notificationDoc.exists()) {
        setNotifications({ ...notifications, ...notificationDoc.data() });
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: profile.displayName,
        photoURL: profile.photoURL
      });

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!currentUser || !file) return;

    try {
      setLoading(true);

      // Delete old photo if exists
      if (profile.photoURL) {
        try {
          const oldPhotoRef = ref(storage, profile.photoURL);
          await deleteObject(oldPhotoRef);
        } catch (error) {
          console.log('No old photo to delete or error deleting:', error);
        }
      }

      // Upload new photo
      const photoRef = ref(storage, `admin-photos/${currentUser.uid}/${file.name}`);
      const snapshot = await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(snapshot.ref);

      // Update profile with new photo URL
      setProfile(prev => ({ ...prev, photoURL }));

      // Update Firebase Auth profile
      await updateProfile(currentUser, { photoURL });

      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.newPassword);

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update password",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHotelSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await setDoc(doc(db, 'settings', 'hotel'), hotelSettings, { merge: true });

      toast({
        title: "Success",
        description: "Hotel settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating hotel settings:', error);
      toast({
        title: "Error",
        description: "Failed to update hotel settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    try {
      setLoading(true);

      // Delete old logo if exists
      if (hotelSettings.logo) {
        try {
          const oldLogoRef = ref(storage, hotelSettings.logo);
          await deleteObject(oldLogoRef);
        } catch (error) {
          console.log('No old logo to delete or error deleting:', error);
        }
      }

      // Upload new logo
      const logoRef = ref(storage, `hotel-assets/logo/${file.name}`);
      const snapshot = await uploadBytes(logoRef, file);
      const logoURL = await getDownloadURL(snapshot.ref);

      setHotelSettings(prev => ({ ...prev, logo: logoURL }));

      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      await setDoc(
        doc(db, 'settings', `notifications_${currentUser.uid}`),
        notifications,
        { merge: true }
      );

      toast({
        title: "Success",
        description: "Notification settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'hotel', label: 'Hotel Settings', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and hotel configuration</p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Admin Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </div>
                    </Label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profile.role}
                      disabled
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Hotel Settings Tab */}
        {activeTab === 'hotel' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHotelSettingsUpdate} className="space-y-6">
                  {/* Hotel Logo */}
                  <div>
                    <Label>Hotel Logo</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      {hotelSettings.logo ? (
                        <img
                          src={hotelSettings.logo}
                          alt="Hotel Logo"
                          className="w-16 h-16 object-contain border rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                          <Upload className="w-4 h-4" />
                          <span>Upload Logo</span>
                        </div>
                      </Label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="hotelName">Hotel Name</Label>
                      <Input
                        id="hotelName"
                        value={hotelSettings.name}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={hotelSettings.description}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={hotelSettings.address}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hotelPhone">Phone</Label>
                      <Input
                        id="hotelPhone"
                        value={hotelSettings.phone}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hotelEmail">Email</Label>
                      <Input
                        id="hotelEmail"
                        type="email"
                        value={hotelSettings.email}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={hotelSettings.website}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={hotelSettings.currency} onValueChange={(value) => setHotelSettings(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={hotelSettings.timezone} onValueChange={(value) => setHotelSettings(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="checkInTime">Check-in Time</Label>
                      <Input
                        id="checkInTime"
                        type="time"
                        value={hotelSettings.checkInTime}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, checkInTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkOutTime">Check-out Time</Label>
                      <Input
                        id="checkOutTime"
                        type="time"
                        value={hotelSettings.checkOutTime}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, checkOutTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={hotelSettings.taxRate}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceFee">Service Fee (%)</Label>
                      <Input
                        id="serviceFee"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={hotelSettings.serviceFee}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, serviceFee: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                      <Textarea
                        id="cancellationPolicy"
                        value={hotelSettings.cancellationPolicy}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                      <Textarea
                        id="termsAndConditions"
                        value={hotelSettings.termsAndConditions}
                        onChange={(e) => setHotelSettings(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                        rows={6}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Hotel Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailBookings">New Bookings</Label>
                      <p className="text-sm text-muted-foreground">Receive emails for new booking requests</p>
                    </div>
                    <Switch
                      id="emailBookings"
                      checked={notifications.emailBookings}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailBookings: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailPayments">Payment Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails for payment confirmations and failures</p>
                    </div>
                    <Switch
                      id="emailPayments"
                      checked={notifications.emailPayments}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailPayments: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailGuests">Guest Messages</Label>
                      <p className="text-sm text-muted-foreground">Receive emails for guest inquiries and messages</p>
                    </div>
                    <Switch
                      id="emailGuests"
                      checked={notifications.emailGuests}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailGuests: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailPromotions">Promotion Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about marketing campaigns and promotions</p>
                    </div>
                    <Switch
                      id="emailPromotions"
                      checked={notifications.emailPromotions}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailPromotions: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">SMS Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsBookings">Urgent Bookings</Label>
                      <p className="text-sm text-muted-foreground">Receive SMS for urgent booking updates</p>
                    </div>
                    <Switch
                      id="smsBookings"
                      checked={notifications.smsBookings}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsBookings: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsPayments">Payment Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive SMS for high-value payment notifications</p>
                    </div>
                    <Switch
                      id="smsPayments"
                      checked={notifications.smsPayments}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsPayments: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive real-time notifications in your browser</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleNotificationUpdate} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default SettingsPage;
