import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../../services/api';

const UserGrowthChart = () => {
  const [chartData, setChartData] = useState({});
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const fetchUserGrowthData = async () => {
      try {
        const { data } = await api.get(`/dashboard/user-growth?period=${period}`);
        const formattedData = {
          labels: data.map((d) => d.date),
          datasets: [
            {
              label: 'New Users',
              data: data.map((d) => d.count),
              fill: true,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderColor: '#10B981',
              tension: 0.1,
            },
          ],
        };
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching user growth data:', error);
      }
    };

    fetchUserGrowthData();
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
        text: `User Growth (${period.charAt(0).toUpperCase() + period.slice(1)})`,
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
      {chartData.labels ? <Line data={chartData} options={options} /> : <p>Loading...</p>}
    </div>
  );
};

export default UserGrowthChart;
