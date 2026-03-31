
import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { fetchPointRewardStats } from '../services/promoApi';
import { Link } from 'react-router-dom';

const PointRewards = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchPointRewardStats(50);
            if (response.success) {
                setStats(response.stats);
            } else {
                setError(response.error || "Failed to fetch point reward stats.");
            }
        } catch (err) {
            setError(err.message || "Something went wrong.");
            console.error("Error fetching point reward stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getServiceIcon = (service) => {
        switch (service) {
            case 'airtime': return '📱';
            case 'data': return '🌐';
            case 'electricity': return '⚡';
            case 'cable_tv': return '📺';
            case 'betting': return '🎰';
            default: return '🎟️';
        }
    };

    const formatServiceName = (name) => {
        return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading && !stats) return <Loader />;

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Point Rewards Management</h1>
                    <p className="text-gray-600 mt-1">Monitor loyalty points earned by users for service payments (Airtime, Data, etc.).</p>
                </div>
                <Link 
                    to="/promos/config" 
                    className="bg-gray-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-300"
                >
                    Configure Rates
                </Link>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-400">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Points Awarded</p>
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl font-extrabold text-gray-800">
                            {stats?.totalPointsAwarded?.toLocaleString() || 0}
                        </span>
                        <span className="text-yellow-500 font-bold">PTS</span>
                    </div>
                </div>

                {stats?.breakdown?.map((item) => (
                    <div key={item.service} className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-2xl">{getServiceIcon(item.service)}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">
                                {item.transactionCount} Tx
                            </span>
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
                            {formatServiceName(item.service)}
                        </p>
                        <div className="flex items-end space-x-1">
                            <span className="text-xl font-bold text-gray-800">{item.totalPoints.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400 mb-1 font-bold">PTS</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent History Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Recent Point Earnings</h2>
                    <button 
                        onClick={fetchData} 
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Refresh List
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    {stats?.recentTransactions?.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Service Involved</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Points Earned</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recentTransactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">
                                                    {tx.user?.fullName?.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{tx.user?.fullName || "Guest User"}</div>
                                                    <div className="text-xs text-gray-500">{tx.user?.phoneNumber || tx.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <span>{getServiceIcon(tx.service)}</span>
                                                <span className="text-sm font-semibold text-gray-700">{formatServiceName(tx.service)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full font-extrabold text-sm border border-yellow-100">
                                                +{tx.amount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12">
                            <EmptyState 
                                type="generic"
                                title="No point rewards yet"
                                description="Transactions with loyalty points will appear here once users successfully pay for bills."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PointRewards;
