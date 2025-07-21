import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, Calendar, Percent, 
  Gift, TrendingUp, Users, Clock, Image as ImageIcon, Upload
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface Promotion {
  id: string;
  title: string;
  description: string;
  promoCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  applicableRoomTypes?: string[];
  bannerImage?: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promoCode: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minimumSpend: 0,
    maximumDiscount: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 0,
    applicableRoomTypes: [] as string[],
    terms: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const promotionsSnapshot = await getDocs(
        query(collection(db, 'promotions'), orderBy('createdAt', 'desc'))
      );
      
      const promotionsData = promotionsSnapshot.docs.map(doc => ({
        id: doc.id,
        usedCount: 0,
        ...doc.data()
      })) as Promotion[];
      
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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
    const fileName = `promotions/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.promoCode) {
      setFormData(prev => ({ ...prev, promoCode: generatePromoCode() }));
    }

    setUploading(true);
    try {
      let bannerImage = editingPromo?.bannerImage || '';
      
      if (selectedFile) {
        bannerImage = await uploadImage(selectedFile);
      }

      const promoData = {
        ...formData,
        bannerImage,
        usedCount: editingPromo?.usedCount || 0,
        updatedAt: new Date().toISOString()
      };

      if (editingPromo) {
        await updateDoc(doc(db, 'promotions', editingPromo.id), promoData);
        toast({
          title: "Success",
          description: "Promotion updated successfully"
        });
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...promoData,
          createdAt: new Date().toISOString()
        });
        toast({
          title: "Success",
          description: "Promotion created successfully"
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        promoCode: '',
        discountType: 'percentage',
        discountValue: 0,
        minimumSpend: 0,
        maximumDiscount: 0,
        startDate: '',
        endDate: '',
        isActive: true,
        usageLimit: 0,
        applicableRoomTypes: [],
        terms: ''
      });
      setSelectedFile(null);
      setPreviewUrl('');
      setEditingPromo(null);
      setIsDialogOpen(false);
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: "Error",
        description: "Failed to save promotion",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`Are you sure you want to delete "${promo.title}"?`)) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'promotions', promo.id));
      
      // Delete banner image if exists
      if (promo.bannerImage) {
        try {
          const storageRef = ref(storage, promo.bannerImage);
          await deleteObject(storageRef);
        } catch (error) {
          console.log('Error deleting image:', error);
        }
      }

      toast({
        title: "Success",
        description: "Promotion deleted successfully"
      });
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description,
      promoCode: promo.promoCode,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumSpend: promo.minimumSpend || 0,
      maximumDiscount: promo.maximumDiscount || 0,
      startDate: promo.startDate,
      endDate: promo.endDate,
      isActive: promo.isActive,
      usageLimit: promo.usageLimit || 0,
      applicableRoomTypes: promo.applicableRoomTypes || [],
      terms: promo.terms
    });
    if (promo.bannerImage) {
      setPreviewUrl(promo.bannerImage);
    }
    setIsDialogOpen(true);
  };

  const togglePromotionStatus = async (promo: Promotion) => {
    try {
      await updateDoc(doc(db, 'promotions', promo.id), {
        isActive: !promo.isActive,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: `Promotion ${!promo.isActive ? 'activated' : 'deactivated'}`
      });
      
      fetchPromotions();
    } catch (error) {
      console.error('Error updating promotion status:', error);
      toast({
        title: "Error",
        description: "Failed to update promotion status",
        variant: "destructive"
      });
    }
  };

  const getPromotionStatus = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800' };
    if (isBefore(now, start)) return { status: 'scheduled', color: 'bg-blue-100 text-blue-800' };
    if (isAfter(now, end)) return { status: 'expired', color: 'bg-red-100 text-red-800' };
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return { status: 'limit reached', color: 'bg-orange-100 text-orange-800' };
    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  // Filter promotions
  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.promoCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const promoStatus = getPromotionStatus(promo);
    const matchesStatus = statusFilter === 'all' || promoStatus.status === statusFilter;
    const matchesType = typeFilter === 'all' || promo.discountType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistics
  const activePromotions = promotions.filter(p => getPromotionStatus(p).status === 'active').length;
  const totalPromotions = promotions.length;
  const totalUsage = promotions.reduce((sum, p) => sum + p.usedCount, 0);

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
          <h1 className="text-3xl font-bold">Promotions Management</h1>
          <p className="text-muted-foreground">Manage promotional offers and discount codes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-luxury" onClick={() => {
              setEditingPromo(null);
              setFormData({
                title: '',
                description: '',
                promoCode: '',
                discountType: 'percentage',
                discountValue: 0,
                minimumSpend: 0,
                maximumDiscount: 0,
                startDate: '',
                endDate: '',
                isActive: true,
                usageLimit: 0,
                applicableRoomTypes: [],
                terms: ''
              });
              setPreviewUrl('');
              setSelectedFile(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingPromo ? 'Edit Promotion' : 'Create New Promotion'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Promotion Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Summer Special Offer"
                    required
                  />
                </div>
                <div>
                  <Label>Promo Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.promoCode}
                      onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, promoCode: generatePromoCode() })}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the promotion offer"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={formData.discountType} onValueChange={(value: any) => 
                    setFormData({ ...formData, discountType: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    min="0"
                    step={formData.discountType === 'percentage' ? "1" : "0.01"}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Usage Limit (0 = unlimited)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Spend (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumSpend}
                    onChange={(e) => setFormData({ ...formData, minimumSpend: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Maximum Discount (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Banner Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {previewUrl && (
                  <div className="mt-2">
                    <img
                      src={previewUrl}
                      alt="Banner preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Terms and Conditions</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Terms and conditions for this promotion"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Active promotion</Label>
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
                      Saving...
                    </>
                  ) : editingPromo ? (
                    'Update Promotion'
                  ) : (
                    'Create Promotion'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Promotions</p>
                <p className="text-2xl font-bold">{totalPromotions}</p>
              </div>
              <Gift className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activePromotions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">{totalUsage}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Usage</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalPromotions > 0 ? Math.round(totalUsage / totalPromotions) : 0}
                </p>
              </div>
              <Percent className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search promotions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promo, index) => {
          const status = getPromotionStatus(promo);
          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {promo.bannerImage && (
                  <div className="relative h-48">
                    <img
                      src={promo.bannerImage}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={status.color}>
                        {status.status}
                      </Badge>
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{promo.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          {promo.promoCode}
                        </Badge>
                        <Badge className={status.color}>
                          {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₹${promo.discountValue}`} OFF
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Start:</span>
                      <span>{format(parseISO(promo.startDate), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>End:</span>
                      <span>{format(parseISO(promo.endDate), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    {promo.usageLimit && (
                      <div className="flex justify-between text-sm">
                        <span>Usage:</span>
                        <span>{promo.usedCount}/{promo.usageLimit}</span>
                      </div>
                    )}
                    {promo.minimumSpend > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Min. Spend:</span>
                        <span>₹{promo.minimumSpend}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(promo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePromotionStatus(promo)}
                        className={promo.isActive ? "text-orange-600" : "text-green-600"}
                      >
                        {promo.isActive ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(promo)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium">
                      {promo.usedCount} uses
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredPromotions.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Promotions Found</h3>
          <p className="text-muted-foreground">Create your first promotion to get started</p>
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;
