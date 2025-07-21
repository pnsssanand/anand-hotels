import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Calendar as CalendarIcon, Package, AlertTriangle, 
  CheckCircle, Clock, Settings, Filter, Search, Wrench
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isSameDay, isAfter, isBefore } from 'date-fns';

interface Room {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
}

interface MaintenanceRecord {
  id: string;
  roomId: string;
  roomName: string;
  type: 'maintenance' | 'cleaning' | 'repair' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  title: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration: number; // in hours
  cost?: number;
  assignedTo?: string;
  createdAt: string;
}

interface AvailabilityBlock {
  id: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'maintenance' | 'reserved' | 'blocked';
}

const InventoryPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'availability'>('overview');
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Form states
  const [maintenanceForm, setMaintenanceForm] = useState({
    roomId: '',
    type: 'maintenance' as 'maintenance' | 'cleaning' | 'repair' | 'inspection',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    title: '',
    description: '',
    scheduledDate: '',
    estimatedDuration: 2,
    assignedTo: '',
    cost: 0
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    roomId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'blocked' as 'maintenance' | 'reserved' | 'blocked'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRooms(),
        fetchMaintenanceRecords(),
        fetchAvailabilityBlocks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchMaintenanceRecords = async () => {
    try {
      const maintenanceSnapshot = await getDocs(collection(db, 'maintenance'));
      const maintenanceData = await Promise.all(
        maintenanceSnapshot.docs.map(async (maintenanceDoc) => {
          const data = maintenanceDoc.data();
          // Get room name
          const roomSnapshot = await getDocs(query(collection(db, 'rooms'), where('__name__', '==', data.roomId)));
          const roomData = roomSnapshot.docs[0]?.data();
          
          return {
            id: maintenanceDoc.id,
            roomName: roomData?.name || 'Unknown Room',
            ...data
          } as MaintenanceRecord;
        })
      );
      setMaintenanceRecords(maintenanceData);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  };

  const fetchAvailabilityBlocks = async () => {
    try {
      const blocksSnapshot = await getDocs(collection(db, 'availabilityBlocks'));
      const blocksData = await Promise.all(
        blocksSnapshot.docs.map(async (blockDoc) => {
          const data = blockDoc.data();
          // Get room name
          const roomSnapshot = await getDocs(query(collection(db, 'rooms'), where('__name__', '==', data.roomId)));
          const roomData = roomSnapshot.docs[0]?.data();
          
          return {
            id: blockDoc.id,
            roomName: roomData?.name || 'Unknown Room',
            ...data
          } as AvailabilityBlock;
        })
      );
      setAvailabilityBlocks(blocksData);
    } catch (error) {
      console.error('Error fetching availability blocks:', error);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const maintenanceData = {
        ...maintenanceForm,
        status: 'scheduled' as const,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'maintenance'), maintenanceData);
      
      // Update room status if high priority
      if (maintenanceForm.priority === 'high' || maintenanceForm.priority === 'urgent') {
        await updateDoc(doc(db, 'rooms', maintenanceForm.roomId), {
          status: 'maintenance'
        });
      }

      toast({
        title: "Success",
        description: "Maintenance scheduled successfully"
      });

      setMaintenanceForm({
        roomId: '',
        type: 'maintenance',
        priority: 'medium',
        title: '',
        description: '',
        scheduledDate: '',
        estimatedDuration: 2,
        assignedTo: '',
        cost: 0
      });
      setIsMaintenanceDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to schedule maintenance",
        variant: "destructive"
      });
    }
  };

  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const availabilityData = {
        ...availabilityForm,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'availabilityBlocks'), availabilityData);

      toast({
        title: "Success",
        description: "Availability block created successfully"
      });

      setAvailabilityForm({
        roomId: '',
        startDate: '',
        endDate: '',
        reason: '',
        type: 'blocked'
      });
      setIsAvailabilityDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating availability block:', error);
      toast({
        title: "Error",
        description: "Failed to create availability block",
        variant: "destructive"
      });
    }
  };

  const updateMaintenanceStatus = async (id: string, status: MaintenanceRecord['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedDate = new Date().toISOString();
      }

      await updateDoc(doc(db, 'maintenance', id), updateData);
      
      toast({
        title: "Success",
        description: "Maintenance status updated"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      toast({
        title: "Error",
        description: "Failed to update maintenance status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'cleaning': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const availableRooms = rooms.filter(room => room.status === 'available').length;
  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;
  const pendingMaintenance = maintenanceRecords.filter(record => record.status === 'scheduled').length;

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage room availability and maintenance</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wrench className="w-4 h-4 mr-2" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Room</Label>
                    <Select value={maintenanceForm.roomId} onValueChange={(value) => 
                      setMaintenanceForm({ ...maintenanceForm, roomId: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} - {room.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={maintenanceForm.type} onValueChange={(value: any) => 
                      setMaintenanceForm({ ...maintenanceForm, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={maintenanceForm.priority} onValueChange={(value: any) => 
                      setMaintenanceForm({ ...maintenanceForm, priority: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Scheduled Date</Label>
                    <Input
                      type="datetime-local"
                      value={maintenanceForm.scheduledDate}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={maintenanceForm.title}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                    placeholder="Brief description of maintenance"
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                    placeholder="Detailed description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estimated Duration (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={maintenanceForm.estimatedDuration}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedDuration: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Estimated Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={maintenanceForm.cost}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Assigned To</Label>
                  <Input
                    value={maintenanceForm.assignedTo}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assignedTo: e.target.value })}
                    placeholder="Staff member or contractor"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Schedule Maintenance
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-luxury">
                <Plus className="w-4 h-4 mr-2" />
                Block Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block Room Availability</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                <div>
                  <Label>Room</Label>
                  <Select value={availabilityForm.roomId} onValueChange={(value) => 
                    setAvailabilityForm({ ...availabilityForm, roomId: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} - {room.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={availabilityForm.startDate}
                      onChange={(e) => setAvailabilityForm({ ...availabilityForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={availabilityForm.endDate}
                      onChange={(e) => setAvailabilityForm({ ...availabilityForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Type</Label>
                  <Select value={availabilityForm.type} onValueChange={(value: any) => 
                    setAvailabilityForm({ ...availabilityForm, type: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={availabilityForm.reason}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, reason: e.target.value })}
                    placeholder="Reason for blocking availability"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAvailabilityDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Block Availability
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableRooms}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-blue-600">{occupiedRooms}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{maintenanceRooms}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="text-2xl font-bold text-red-600">{pendingMaintenance}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {[
          { key: 'overview', label: 'Room Status' },
          { key: 'maintenance', label: 'Maintenance' },
          { key: 'availability', label: 'Availability Blocks' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-2 px-4 ${
              activeTab === tab.key
                ? 'border-b-2 border-primary text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-sm text-muted-foreground">{room.type}</p>
                    </div>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Occupancy:</span>
                      <span>{room.status === 'occupied' ? 'Occupied' : 'Available'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          {maintenanceRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{record.title}</h3>
                        <Badge className={getPriorityColor(record.priority)}>
                          {record.priority}
                        </Badge>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {record.roomName} • {record.type}
                      </p>
                      <p className="text-sm mb-4">{record.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Scheduled:</span>
                          <br />
                          {format(new Date(record.scheduledDate), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <br />
                          {record.estimatedDuration} hours
                        </div>
                        {record.cost && (
                          <div>
                            <span className="font-medium">Cost:</span>
                            <br />
                            ₹{record.cost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {record.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => updateMaintenanceStatus(record.id, 'in-progress')}
                        >
                          Start
                        </Button>
                      )}
                      {record.status === 'in-progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateMaintenanceStatus(record.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="space-y-4">
          {availabilityBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{block.roomName}</h3>
                        <Badge className={getStatusColor(block.type)}>
                          {block.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(new Date(block.startDate), 'MMM dd, yyyy')} - {format(new Date(block.endDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm">{block.reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Remove this availability block?')) {
                          deleteDoc(doc(db, 'availabilityBlocks', block.id));
                          fetchData();
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
