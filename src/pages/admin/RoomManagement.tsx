
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, Eye } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Room } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    price: 0,
    capacity: 1,
    size: 0,
    images: [] as string[],
    amenities: [] as string[],
    availability: true,
    features: {
      bedType: '',
      bathrooms: 1,
      hasBalcony: false,
      hasOceanView: false,
      hasKitchen: false
    }
  });

  const roomTypes = [
    'Deluxe Room',
    'Ocean Suite',
    'Presidential Villa',
    'Business Executive',
    'Family Suite'
  ];

  const availableAmenities = [
    'WiFi', 'Ocean View', 'Mini Bar', 'Room Service', 'Spa Access',
    'Concierge', 'Private Pool', 'Butler Service', 'Kitchen', 'Parking',
    'Work Desk', 'Coffee Machine', 'Gym Access', 'Executive Lounge',
    'Kitchenette', 'Living Area', 'Kids Area', 'Pool Access', 'Family Services',
    'Jacuzzi', 'Fireplace', 'Champagne Service', 'Garden View', 'Balcony'
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const result = await uploadToCloudinary(file);
        uploadedUrls.push(result.secure_url);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roomData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingRoom) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), roomData);
        toast({
          title: "Success",
          description: "Room updated successfully"
        });
      } else {
        await addDoc(collection(db, 'rooms'), roomData);
        toast({
          title: "Success",
          description: "Room added successfully"
        });
      }

      setShowAddModal(false);
      setEditingRoom(null);
      resetForm();
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: "Failed to save room",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      toast({
        title: "Success",
        description: "Room deleted successfully"
      });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive"  
      });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      size: room.size,
      images: room.images,
      amenities: room.amenities,
      availability: room.availability,
      features: room.features
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      price: 0,
      capacity: 1,
      size: 0,
      images: [],
      amenities: [],
      availability: true,
      features: {
        bedType: '',
        bathrooms: 1,
        hasBalcony: false,
        hasOceanView: false,
        hasKitchen: false
      }
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Room Management</h1>
          <p className="text-muted-foreground">Manage your hotel rooms and amenities</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingRoom(null);
            setShowAddModal(true);
          }}
          className="btn-luxury"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={room.images[0] || '/placeholder.svg'}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${
                  room.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {room.availability ? 'Available' : 'Unavailable'}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-1">{room.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{room.type}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary">${room.price}/night</span>
                  <span className="text-sm text-muted-foreground">Up to {room.capacity} guests</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(room)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(room.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Room Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Room Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Type</option>
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price per Night ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  className="w-full p-3 border rounded-lg"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Size (sqft)</label>
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Room Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                </label>
              </div>
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Room ${index + 1}`}
                        className="w-full aspect-video object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium mb-2">Amenities</label>
              <div className="grid grid-cols-3 gap-2">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="rounded"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-medium">Room Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bed Type</label>
                  <input
                    type="text"
                    value={formData.features.bedType}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, bedType: e.target.value }
                    }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g., King Bed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.features.bathrooms}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, bathrooms: parseInt(e.target.value) }
                    }))}
                    className="w-full p-3 border rounded-lg"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.features.hasBalcony}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, hasBalcony: e.target.checked }
                    }))}
                  />
                  <span>Has Balcony</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.features.hasOceanView}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, hasOceanView: e.target.checked }
                    }))}
                  />
                  <span>Ocean View</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.features.hasKitchen}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, hasKitchen: e.target.checked }
                    }))}
                  />
                  <span>Has Kitchen</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="btn-luxury" disabled={uploading}>
                {uploading ? 'Uploading...' : editingRoom ? 'Update Room' : 'Add Room'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;
