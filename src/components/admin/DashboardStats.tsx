
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp, Bed, Percent } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalRooms: number;
    totalBookings: number;
    totalUsers: number;
    totalRevenue: number;
    occupancyRate: number;
    averageStay: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Bed,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      change: '+2 new rooms'
    },
    {
      title: 'Active Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
      change: '+12% this month'
    },
    {
      title: 'Total Guests',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      change: '+5% this week'
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      change: '+18% this month'
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: Percent,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      change: '+3% from last month'
    },
    {
      title: 'Avg Stay Duration',
      value: `${stats.averageStay} days`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      change: 'Stable'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
