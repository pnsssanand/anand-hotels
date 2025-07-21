import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Eye, Mail, Phone, Calendar, 
  MessageCircle, Archive, Star, Reply, Trash2
} from 'lucide-react';
import { collection, getDocs, updateDoc, deleteDoc, doc, orderBy, query, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  isStarred: boolean;
  createdAt: string;
  readAt?: string;
  repliedAt?: string;
  reply?: string;
}

const MessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesSnapshot = await getDocs(
        query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
      );
      
      const messagesData = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        status: 'unread',
        priority: 'medium',
        isStarred: false,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: Message['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'read' && !messages.find(m => m.id === messageId)?.readAt) {
        updateData.readAt = new Date().toISOString();
      }
      if (status === 'replied') {
        updateData.repliedAt = new Date().toISOString();
      }

      await updateDoc(doc(db, 'messages', messageId), updateData);
      
      toast({
        title: "Success",
        description: "Message status updated"
      });
      
      fetchMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive"
      });
    }
  };

  const toggleStar = async (messageId: string, isStarred: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { isStarred: !isStarred });
      fetchMessages();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const updatePriority = async (messageId: string, priority: Message['priority']) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { priority });
      fetchMessages();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    try {
      // Update message with reply
      await updateDoc(doc(db, 'messages', selectedMessage.id), {
        status: 'replied',
        reply: replyText,
        repliedAt: new Date().toISOString()
      });

      // Here you would typically send an email to the user
      // For now, we'll just show a success message
      
      toast({
        title: "Success",
        description: "Reply sent successfully"
      });

      setReplyText('');
      setIsReplyDialogOpen(false);
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteDoc(doc(db, 'messages', messageId));
      
      toast({
        title: "Success",
        description: "Message deleted successfully"
      });
      
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      updateMessageStatus(message.id, 'read');
    }
    setIsViewDialogOpen(true);
  };

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics
  const totalMessages = messages.length;
  const unreadMessages = messages.filter(m => m.status === 'unread').length;
  const repliedMessages = messages.filter(m => m.status === 'replied').length;
  const starredMessages = messages.filter(m => m.isStarred).length;

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
          <h1 className="text-3xl font-bold">Messages Management</h1>
          <p className="text-muted-foreground">Manage customer inquiries and messages</p>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-red-600">{unreadMessages}</p>
              </div>
              <Mail className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold text-green-600">{repliedMessages}</p>
              </div>
              <Reply className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Starred</p>
                <p className="text-2xl font-bold text-yellow-600">{starredMessages}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Messages</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`hover:shadow-lg transition-shadow ${message.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => toggleStar(message.id, message.isStarred)}
                        className={`p-1 rounded ${message.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                      >
                        <Star className={`w-4 h-4 ${message.isStarred ? 'fill-current' : ''}`} />
                      </button>
                      <h3 className="font-semibold">{message.name}</h3>
                      <Badge className={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                      <select
                        value={message.priority}
                        onChange={(e) => updatePriority(message.id, e.target.value as Message['priority'])}
                        className={`text-xs px-2 py-1 rounded border-none ${getPriorityColor(message.priority)}`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 mr-2" />
                        {message.email}
                      </div>
                      {message.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 mr-2" />
                          {message.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(parseISO(message.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>

                    <h4 className="font-medium mb-2">{message.subject}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {message.message}
                    </p>

                    {message.reply && (
                      <div className="bg-gray-50 p-3 rounded-lg mt-3">
                        <p className="text-sm font-medium text-green-600 mb-1">Reply sent:</p>
                        <p className="text-sm">{message.reply}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.repliedAt && format(parseISO(message.repliedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewMessage(message)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {message.status !== 'replied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMessage(message);
                          setIsReplyDialogOpen(true);
                        }}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(message.id, 
                        message.status === 'archived' ? 'read' : 'archived'
                      )}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(message.id)}
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

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedMessage.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedMessage.email}</p>
                    {selectedMessage.phone && (
                      <p><span className="font-medium">Phone:</span> {selectedMessage.phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Message Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Date:</span> {format(parseISO(selectedMessage.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedMessage.status)}`}>
                        {selectedMessage.status}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Priority:</span> 
                      <Badge className={`ml-2 ${getPriorityColor(selectedMessage.priority)}`}>
                        {selectedMessage.priority}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Subject</h3>
                <p className="bg-gray-50 p-3 rounded">{selectedMessage.subject}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Message</h3>
                <p className="bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {selectedMessage.reply && (
                <div>
                  <h3 className="font-semibold mb-3">Reply</h3>
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                    <p>{selectedMessage.reply}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Sent on {selectedMessage.repliedAt && format(parseISO(selectedMessage.repliedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold">{selectedMessage.subject}</h4>
                <p className="text-sm text-muted-foreground">From: {selectedMessage.name} ({selectedMessage.email})</p>
              </div>
              
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <Label>Reply</Label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Send Reply
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Messages Found</h3>
          <p className="text-muted-foreground">No messages match your current filters</p>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
