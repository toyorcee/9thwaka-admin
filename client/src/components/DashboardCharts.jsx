import React from 'react';
import RevenueChart from './charts/RevenueChart';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import UserGrowthChart from './charts/UserGrowthChart';

import OrderStatsChart from './charts/OrderStatsChart';
import UserRoleGrowthChart from './charts/UserRoleGrowthChart';

const DashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RevenueChart />
      <UserGrowthChart />
      <OrderStatsChart />
      <UserRoleGrowthChart />
    </div>
  );
};

export default DashboardCharts;
