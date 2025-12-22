import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import api from '../../services/api';

const OrderStatsChart = () => {
  const [chartData, setChartData] = useState({});
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const fetchOrderStatsData = async () => {
      try {
        const { data } = await api.get(`/dashboard/order-stats?period=${period}`);
        const formattedData = {
          labels: ['Total Orders', 'Courier Orders', 'Ride Orders'],
          datasets: [
            {
              label: 'Order Stats',
              data: [data.totalOrders, data.courierOrders, data.rideOrders],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
              ],
              borderWidth: 1,
            },
          ],
        };
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching order stats data:', error);
      }
    };

    fetchOrderStatsData();
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
        text: `Order Statistics (${period.charAt(0).toUpperCase() + period.slice(1)})`,
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
      {chartData.labels ? <Bar data={chartData} options={options} /> : <p>Loading...</p>}
    </div>
  );
};

export default OrderStatsChart;
