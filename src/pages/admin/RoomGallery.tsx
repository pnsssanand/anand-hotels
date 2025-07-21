import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Upload, Eye, Edit, Trash2, Search, Filter, Image as ImageIcon,
  Star, Calendar, Users, Bed
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface RoomGallery {
  id: string;
  roomId: string;
  roomName: string;
  imageUrl: string;
  imageTitle: string;
  imageDescription: string;
  imageType: 'main' | 'bedroom' | 'bathroom' | 'amenity' | 'view';
  isMainImage: boolean;
  uploadedAt: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
}

const RoomGalleryPage = () => {
  const [gallery, setGallery] = useState<RoomGallery[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<RoomGallery | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    roomId: '',
    imageTitle: '',
    imageDescription: '',
    imageType: 'main' as 'main' | 'bedroom' | 'bathroom' | 'amenity' | 'view',
    isMainImage: false
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchGallery();
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
    }
  };

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const gallerySnapshot = await getDocs(collection(db, 'roomGallery'));
      const galleryData = await Promise.all(
        gallerySnapshot.docs.map(async (galleryDoc) => {
          const data = galleryDoc.data();
          // Get room name
          const roomSnapshot = await getDocs(query(collection(db, 'rooms'), where('__name__', '==', data.roomId)));
          const roomData = roomSnapshot.docs[0]?.data();
          
          return {
            id: galleryDoc.id,
            roomName: roomData?.name || 'Unknown Room',
            ...data
          } as RoomGallery;
        })
      );
      setGallery(galleryData);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `room-gallery/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !editingImage) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = editingImage?.imageUrl || '';
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const galleryData = {
        roomId: formData.roomId,
        imageUrl,
        imageTitle: formData.imageTitle,
        imageDescription: formData.imageDescription,
        imageType: formData.imageType,
        isMainImage: formData.isMainImage,
        uploadedAt: new Date().toISOString()
      };

      if (editingImage) {
        await updateDoc(doc(db, 'roomGallery', editingImage.id), galleryData);
        toast({
          title: "Success",
          description: "Image updated successfully"
        });
      } else {
        await addDoc(collection(db, 'roomGallery'), galleryData);
        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });
      }

      // Reset form
      setFormData({
        roomId: '',
        imageTitle: '',
        imageDescription: '',
        imageType: 'main',
        isMainImage: false
      });
      setSelectedFile(null);
      setPreviewUrl('');
      setEditingImage(null);
      setIsDialogOpen(false);
      fetchGallery();
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Error",
        description: "Failed to save image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: RoomGallery) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'roomGallery', image.id));
      
      // Delete from Storage
      const storageRef = ref(storage, image.imageUrl);
      await deleteObject(storageRef);

      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
      fetchGallery();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (image: RoomGallery) => {
    setEditingImage(image);
    setFormData({
      roomId: image.roomId,
      imageTitle: image.imageTitle,
      imageDescription: image.imageDescription,
      imageType: image.imageType,
      isMainImage: image.isMainImage
    });
    setPreviewUrl(image.imageUrl);
    setIsDialogOpen(true);
  };

  const filteredGallery = gallery.filter(image => {
    const matchesSearch = image.imageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || image.imageType === filterType;
    const matchesRoom = selectedRoom === 'all' || image.roomId === selectedRoom;
    
    return matchesSearch && matchesType && matchesRoom;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold">Room Gallery</h1>
          <p className="text-muted-foreground">Manage room images and visual content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-luxury" onClick={() => {
              setEditingImage(null);
              setFormData({
                roomId: '',
                imageTitle: '',
                imageDescription: '',
                imageType: 'main',
                isMainImage: false
              });
              setPreviewUrl('');
              setSelectedFile(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? 'Edit Image' : 'Upload New Image'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Select value={formData.roomId} onValueChange={(value) => 
                    setFormData({ ...formData, roomId: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imageType">Image Type</Label>
                  <Select value={formData.imageType} onValueChange={(value: any) => 
                    setFormData({ ...formData, imageType: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Image</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="amenity">Amenity</SelectItem>
                      <SelectItem value="view">View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="imageTitle">Image Title</Label>
                <Input
                  value={formData.imageTitle}
                  onChange={(e) => setFormData({ ...formData, imageTitle: e.target.value })}
                  placeholder="Enter image title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="imageDescription">Description</Label>
                <Textarea
                  value={formData.imageDescription}
                  onChange={(e) => setFormData({ ...formData, imageDescription: e.target.value })}
                  placeholder="Enter image description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              
              {previewUrl && (
                <div className="mt-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isMainImage"
                  checked={formData.isMainImage}
                  onChange={(e) => setFormData({ ...formData, isMainImage: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isMainImage">Set as main image for this room</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : editingImage ? (
                    'Update Image'
                  ) : (
                    'Upload Image'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Room</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="main">Main Image</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="amenity">Amenity</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGallery.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={image.imageUrl}
                  alt={image.imageTitle}
                  className="w-full h-48 object-cover"
                />
                {image.isMainImage && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Main
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-black/70 text-white px-2 py-1 rounded text-xs capitalize">
                    {image.imageType}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{image.imageTitle}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Room: {image.roomName}
                </p>
                {image.imageDescription && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {image.imageDescription}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(image.imageUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(image)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(image)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredGallery.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Images Found</h3>
          <p className="text-muted-foreground">Start by uploading some room images</p>
        </div>
      )}
    </div>
  );
};

export default RoomGalleryPage;
