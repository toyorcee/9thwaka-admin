import React, { useEffect, useState } from "react";
import api from "../services/api";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/withdrawals', {
        params: {
          page,
          limit: 20,
          status: statusFilter
        }
      });
      setWithdrawals(response.data.withdrawals || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
      setError("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, statusFilter]);

  const handleVerifyStatus = async (withdrawalId) => {
    try {
      setVerifyingId(withdrawalId);
      const response = await api.post(`/withdrawals/${withdrawalId}/verify-status`);
      
      if (response.data.success) {
        await fetchWithdrawals();
        alert(`Status Verified: ${response.data.data.status}`); 
      } else {
        alert("Verification failed: " + (response.data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Failed to verify status: " + (err.response?.data?.error || err.message));
    } finally {
      setVerifyingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Completed</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1"><XCircleIcon className="w-3 h-3"/> Failed</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1"><ArrowPathIcon className="w-3 h-3 animate-spin"/> Processing</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {status}</span>;
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="p-6 h-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="mb-6 flex gap-4">
           <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                   {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <th key={i} className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                   ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row}>
                    {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h1>
           <p className="text-gray-600">Manage and verify user withdrawal requests</p>
        </div>
        <button 
           onClick={fetchWithdrawals} 
           className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
           title="Refresh"
        >
           <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-6 flex gap-4">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
          </select>
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState 
            title="No withdrawals found" 
            description="There are no withdrawal requests matching your criteria." 
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{withdrawal.userId?.fullName || 'Unknown User'}</div>
                      <div className="text-xs text-gray-500">{withdrawal.userId?.email}</div>
                      <div className="text-xs text-gray-500 capitalize">{withdrawal.userId?.userType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">₦{withdrawal.amount?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{withdrawal.bankName}</div>
                      <div className="text-sm text-gray-500">{withdrawal.bankAccountNumber}</div>
                      <div className="text-xs text-gray-400">{withdrawal.accountName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{withdrawal.transferReference || 'N/A'}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.failureReason && (
                          <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={withdrawal.failureReason}>
                              {withdrawal.failureReason}
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(withdrawal.status === 'processing' || withdrawal.status === 'pending') && (
                          <button
                            onClick={() => handleVerifyStatus(withdrawal._id)}
                            disabled={verifyingId === withdrawal._id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {verifyingId === withdrawal._id ? (
                                <ArrowPathIcon className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                                <ShieldCheckIcon className="w-3 h-3 mr-1" />
                            )}
                            {verifyingId === withdrawal._id ? 'Checking...' : 'Verify Status'}
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
             <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</button>
             </div>
             <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">Previous</button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">Next</button>
                    </nav>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawals;
