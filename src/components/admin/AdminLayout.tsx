
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import ProtectedAdminRoute from './ProtectedAdminRoute';

const AdminLayout = () => {
  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminLayout;
