
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/admin/AdminLayout";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Dashboard from "./pages/Dashboard";
import Contact from "./pages/Contact";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RoomManagement from "./pages/admin/RoomManagement";
import RoomGallery from "./pages/admin/RoomGallery";
import Inventory from "./pages/admin/Inventory";
import Bookings from "./pages/admin/Bookings";
import Guests from "./pages/admin/Guests";
import Promotions from "./pages/admin/Promotions";
import Messages from "./pages/admin/Messages";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="rooms/:id" element={<RoomDetails />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="contact" element={<Contact />} />
              <Route path="offers" element={<Offers />} />
              <Route path="about" element={<About />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Admin Login Route (Outside of Layout) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route index element={<AdminDashboard />} />
              <Route path="rooms" element={<RoomManagement />} />
              <Route path="gallery" element={<RoomGallery />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="guests" element={<Guests />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="messages" element={<Messages />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
