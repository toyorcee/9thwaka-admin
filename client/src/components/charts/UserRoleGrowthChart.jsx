import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../../services/api';

const UserRoleGrowthChart = () => {
  const [chartData, setChartData] = useState({});
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const fetchUserRoleGrowth = async () => {
      try {
        const { data } = await api.get(`/dashboard/user-role-growth?period=${period}`);

        const labels = data.map((d) => d.date);
        const customerData = data.map((d) => d.customers);
        const riderData = data.map((d) => d.riders);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Customers',
              data: customerData,
              borderColor: '#4A90E2',
              backgroundColor: 'rgba(74, 144, 226, 0.2)',
              fill: true,
            },
            {
              label: 'Riders',
              data: riderData,
              borderColor: '#F5A623',
              backgroundColor: 'rgba(245, 166, 35, 0.2)',
              fill: true,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching user role growth data:', error);
      }
    };

    fetchUserRoleGrowth();
  }, [period]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#FFFFFF',
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: `User Growth: Customers vs. Riders (${period.charAt(0).toUpperCase() + period.slice(1)})`,
        color: '#FFFFFF',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#FFFFFF',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#FFFFFF',
        },
      },
    },
  };

  return (
    <div className="bg-nav-dark p-4 rounded-lg" style={{ height: '400px' }}>
      <div className="flex justify-end mb-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-700 text-white rounded-md p-2"
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      {chartData.labels ? (
        <Line data={chartData} options={options} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default UserRoleGrowthChart;
