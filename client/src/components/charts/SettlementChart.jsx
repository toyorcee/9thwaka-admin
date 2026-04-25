import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Filler, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const SettlementChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800/20 rounded-[2rem] border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest text-center px-8">
          No settlement data available for this period to generate a trend graph.
        </p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d._id),
    datasets: [
      {
        fill: true,
        label: 'Platform Commission (₦)',
        data: data.map(d => d.amount),
        borderColor: '#2563eb', 
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#000',
        padding: 12,
        titleFont: { size: 10, weight: 'bold', family: 'Inter' },
        bodyFont: { size: 14, weight: '900', family: 'Inter' },
        displayColors: false,
        callbacks: {
          label: (context) => ` ₦${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#94a3b8',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.3)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#94a3b8',
          callback: (value) => `₦${value.toLocaleString()}`
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default SettlementChart;
