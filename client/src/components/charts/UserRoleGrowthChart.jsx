import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import api from '../../services/api';

const UserRoleGrowthChart = () => {
  const [chartData, setChartData] = useState({});
  const [period, setPeriod] = useState('monthly');
  const [verification, setVerification] = useState('all');

  useEffect(() => {
    const fetchUserRoleGrowth = async () => {
      try {
        const { data } = await api.get(
          `/dashboard/user-role-growth?period=${period}&verification=${verification}`
        );

        const sorted = [...data].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const labels = [];
        const customerData = [];
        const riderData = [];
        let customerTotal = 0;
        let riderTotal = 0;

        for (const item of sorted) {
          labels.push(item.date);
          customerTotal += item.customers || 0;
          riderTotal += item.riders || 0;
          customerData.push(customerTotal);
          riderData.push(riderTotal);
        }

        if (labels.length === 1) {
          const firstLabel = labels[0];
          let baseLabel = firstLabel;

          if (period === 'yearly') {
            const baseDate = new Date(`${firstLabel}-01`);
            baseDate.setFullYear(baseDate.getFullYear() - 1);
            const year = baseDate.getFullYear();
            const month = String(baseDate.getMonth() + 1).padStart(2, '0');
            baseLabel = `${year}-${month}`;
          } else {
            const baseDate = new Date(firstLabel);
            if (!Number.isNaN(baseDate.getTime())) {
              baseDate.setDate(baseDate.getDate() - 1);
              baseLabel = baseDate.toISOString().slice(0, 10);
            }
          }

          labels.unshift(baseLabel);
          customerData.unshift(0);
          riderData.unshift(0);
        }

        setChartData({
          labels,
          datasets: [
            {
              label: 'Customers',
              data: customerData,
              borderColor: '#22C55E',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              fill: true,
              tension: 0.25,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Riders',
              data: riderData,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              fill: true,
              tension: 0.25,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching user role growth data:', error);
      }
    };

    fetchUserRoleGrowth();
  }, [period, verification]);

  const verificationLabel =
    verification === 'verified'
      ? 'Verified'
      : verification === 'unverified'
      ? 'Unverified'
      : 'All';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4B5563',
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: `User Growth (${verificationLabel}): Customers vs. Riders (${period
          .charAt(0)
          .toUpperCase() + period.slice(1)})`,
        color: '#4B5563',
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
          color: '#4B5563',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#4B5563',
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
      <div className="flex justify-between mb-4">
        <select
          value={verification}
          onChange={(e) => setVerification(e.target.value)}
          className="bg-gray-100 text-gray-800 rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="all">All users</option>
          <option value="verified">Verified only</option>
          <option value="unverified">Unverified only</option>
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-100 text-gray-800 rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      {chartData.labels ? <Bar data={chartData} options={options} /> : <p>Loading...</p>}
    </div>
  );
};

export default UserRoleGrowthChart;
