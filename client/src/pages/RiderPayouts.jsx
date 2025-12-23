import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount || 0);
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const RiderPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekStartFilter, setWeekStartFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedRiderIdFilter, setSelectedRiderIdFilter] = useState(null);
  const [blockedRiders, setBlockedRiders] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState(null);
  const [blockedActionLoading, setBlockedActionLoading] = useState(null);
  const [blockedActionError, setBlockedActionError] = useState(null);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (selectedRiderIdFilter) {
        params.riderId = selectedRiderIdFilter;
      }
      if (weekStartFilter) {
        params.weekStart = weekStartFilter;
      }

      const response = await api.get('/payouts', { params });
      const fetched = response?.data?.payouts || [];
      setPayouts(fetched);
    } catch (e) {
      setError('Failed to load rider payouts.');
      console.error('Failed to load rider payouts:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedRiders = async () => {
    try {
      setBlockedLoading(true);
      setBlockedError(null);
      const response = await api.get('/payouts/admin/riders/blocked');
      const riders = response?.data?.riders || [];
      setBlockedRiders(riders);
    } catch (e) {
      setBlockedError('Failed to load blocked riders.');
      console.error('Failed to load blocked riders:', e);
    } finally {
      setBlockedLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, weekStartFilter, selectedRiderIdFilter]);

  useEffect(() => {
    loadBlockedRiders();
  }, []);

  const filteredPayouts = payouts.filter((payout) => {
    if (paymentStatusFilter === 'overdue' && !payout.isOverdue) {
      return false;
    }
    if (paymentStatusFilter === 'due' && !payout.isPaymentDue) {
      return false;
    }
    if (paymentStatusFilter === 'grace' && !payout.isInGracePeriod) {
      return false;
    }
    if (
      paymentStatusFilter === 'clear' &&
      (payout.isOverdue || payout.isPaymentDue || payout.isInGracePeriod)
    ) {
      return false;
    }

    if (!search.trim()) {
      return true;
    }
    const term = search.trim().toLowerCase();
    const name = payout.riderName || '';
    const email = payout.riderEmail || '';
    const phone = payout.riderPhoneNumber || '';
    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      phone.toLowerCase().includes(term)
    );
  });

  const handleOpenMarkPaid = (payout) => {
    setSelectedPayout(payout);
    setPaymentProofFile(null);
    setPaymentError(null);
  };

  const handleCloseMarkPaid = () => {
    setSelectedPayout(null);
    setPaymentProofFile(null);
    setPaymentError(null);
  };

  const handleViewBlockedRiderPayouts = (rider) => {
    setSelectedRiderIdFilter(rider._id);
    const name = rider.fullName || '';
    const email = rider.email || '';
    const phone = rider.phoneNumber || '';
    const label = name || email || phone || '';
    setSearch(label);
  };

  const handleUnblockRider = async (riderId) => {
    try {
      setBlockedActionLoading(riderId);
      setBlockedActionError(null);
      await api.patch(`/payouts/admin/riders/${riderId}/unblock`, {});
      await loadBlockedRiders();
      await loadPayouts();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to unblock rider.';
      setBlockedActionError(message);
      console.error('Failed to unblock rider:', err);
    } finally {
      setBlockedActionLoading(null);
    }
  };

  const handleDeactivateRider = async (riderId) => {
    try {
      setBlockedActionLoading(riderId);
      setBlockedActionError(null);
      await api.patch(`/payouts/admin/riders/${riderId}/deactivate`, {});
      await loadBlockedRiders();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to deactivate rider.';
      setBlockedActionError(message);
      console.error('Failed to deactivate rider:', err);
    } finally {
      setBlockedActionLoading(null);
    }
  };

  const handleReactivateRider = async (riderId) => {
    try {
      setBlockedActionLoading(riderId);
      setBlockedActionError(null);
      await api.patch(`/payouts/admin/riders/${riderId}/reactivate`, {
        unblockPayment: true,
      });
      await loadBlockedRiders();
      await loadPayouts();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to reactivate rider.';
      setBlockedActionError(message);
      console.error('Failed to reactivate rider:', err);
    } finally {
      setBlockedActionLoading(null);
    }
  };

  const handleConfirmMarkPaid = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      setPaymentSaving(true);
      setPaymentError(null);

      const formData = new FormData();
      if (paymentProofFile) {
        formData.append('paymentProof', paymentProofFile);
      }

      await api.patch(`/payouts/${selectedPayout._id}/mark-paid`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPayouts((prev) =>
        prev.map((p) =>
          p._id === selectedPayout._id
            ? {
                ...p,
                status: 'paid',
                paidAt: new Date().toISOString(),
              }
            : p
        )
      );

      handleCloseMarkPaid();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to mark payout as paid.';
      setPaymentError(message);
      console.error('Failed to mark payout as paid:', err);
    } finally {
      setPaymentSaving(false);
    }
  };

  if (loading) {
    return <Loader text="Loading rider payouts..." />;
  }

  return (
    <div className="p-6 h-full space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-gray-800">Rider Payouts</h1>
          <p className="text-gray-600">
            Track weekly rider commission payouts and payment status.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPayouts}
          className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {selectedRiderIdFilter && (
        <div className="mb-2 text-sm text-gray-700">
          Showing payouts for a specific rider based on selection below.
          <button
            type="button"
            onClick={() => {
              setSelectedRiderIdFilter(null);
              setSearch('');
            }}
            className="ml-2 text-accent-blue hover:underline"
          >
            Clear rider filter
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search by rider name, email, or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="all">All payout statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="all">All payment windows</option>
          <option value="due">Due now</option>
          <option value="grace">In grace period</option>
          <option value="overdue">Overdue</option>
          <option value="clear">No payment due</option>
        </select>
        <input
          type="date"
          value={weekStartFilter}
          onChange={(e) => setWeekStartFilter(e.target.value)}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {blockedActionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {blockedActionError}
        </div>
      )}

      {filteredPayouts.length === 0 ? (
        <EmptyState
          type="generic"
          title="No rider payouts found"
          description="Weekly rider payouts will appear here after orders are completed and payouts are generated."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Rider</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Contact</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Week</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">Gross</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">Commission</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">Rider Net</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Payment window
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Status</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Paid At</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Proof</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => {
                const totals = payout.totals || {};
                const proofUrl =
                  payout.paymentProofScreenshot && API_BASE_URL
                    ? `${API_BASE_URL}${payout.paymentProofScreenshot}`
                    : null;
                const isOverdue = payout.isOverdue;
                const isInGrace = payout.isInGracePeriod;
                const isDueNow = payout.isPaymentDue;
                let paymentStatusLabel = 'On track';
                let paymentStatusClass = 'bg-gray-100 text-gray-700';
                if (isOverdue) {
                  paymentStatusLabel = 'Overdue';
                  paymentStatusClass = 'bg-red-100 text-red-700';
                } else if (isInGrace) {
                  paymentStatusLabel = 'Grace period';
                  paymentStatusClass = 'bg-orange-100 text-orange-700';
                } else if (isDueNow) {
                  paymentStatusLabel = 'Due';
                  paymentStatusClass = 'bg-yellow-100 text-yellow-700';
                }

                return (
                  <tr
                    key={payout._id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      isOverdue ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-gray-800">
                      {payout.riderName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-800">
                      <div className="text-sm">
                        <p>{payout.riderEmail || 'N/A'}</p>
                        <p>{payout.riderPhoneNumber || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-800 text-sm">
                      <div>
                        <p>Start: {formatDateTime(payout.weekStart)}</p>
                        <p>End: {formatDateTime(payout.weekEnd)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatCurrency(totals.gross)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatCurrency(totals.commission)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatCurrency(totals.riderNet)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${paymentStatusClass}`}
                      >
                        {paymentStatusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {payout.status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800">
                      {payout.paidAt ? formatDateTime(payout.paidAt) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-blue hover:underline text-sm"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {payout.status === 'paid' ? (
                        <span className="text-xs text-gray-500">Already paid</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenMarkPaid(payout)}
                          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-300"
                        >
                          Mark as paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Mark payout as paid
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Rider: <span className="font-medium">{selectedPayout.riderName}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Week: {formatDateTime(selectedPayout.weekStart)} –{' '}
              {formatDateTime(selectedPayout.weekEnd)}
            </p>
            <p className="text-sm text-gray-800 mb-4">
              Commission amount:{' '}
              <span className="font-semibold">
                {formatCurrency(selectedPayout.totals?.commission)}
              </span>
            </p>
            {paymentError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {paymentError}
              </div>
            )}
            <form onSubmit={handleConfirmMarkPaid} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Payment proof (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    setPaymentProofFile(file || null);
                  }}
                  className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional screenshot of manual transfer or payment confirmation.
                </p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseMarkPaid}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                  disabled={paymentSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentSaving ? 'Saving...' : 'Confirm paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Blocked riders (payment defaults)
            </h2>
            <p className="text-sm text-gray-600">
              Riders blocked after overdue commission payments, with their current week payout.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBlockedRiders}
            className="bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Refresh blocked list
          </button>
        </div>

        {blockedLoading ? (
          <Loader text="Loading blocked riders..." />
        ) : blockedError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {blockedError}
          </div>
        ) : blockedRiders.length === 0 ? (
          <EmptyState
            type="generic"
            title="No blocked riders"
            description="When riders default on commission payments, they will appear here for review."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">Rider</th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">Contact</th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">Blocked At</th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">Reason</th>
                  <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                    Current week payout
                  </th>
                  <th className="py-3 px-4 text-center text-gray-600 font-semibold">Account</th>
                  <th className="py-3 px-4 text-center text-gray-600 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedRiders.map((rider) => {
                  const currentPayout = rider.currentWeekPayout || null;
                  return (
                    <tr
                      key={rider._id}
                      className="border-b border-gray-200 hover:bg-gray-50 align-top"
                    >
                      <td className="py-3 px-4 text-gray-800">
                        <div className="font-medium">{rider.fullName || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-800 text-sm">
                        <div>{rider.email || 'N/A'}</div>
                        <div>{rider.phoneNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-800 text-sm">
                        {rider.paymentBlockedAt
                          ? formatDateTime(rider.paymentBlockedAt)
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-800 text-sm max-w-xs">
                        <div className="line-clamp-3">
                          {rider.paymentBlockedReason || 'No reason recorded'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-800 text-sm">
                        {currentPayout ? (
                          <div className="space-y-1">
                            <div>{formatCurrency(currentPayout.commission)}</div>
                            <div className="text-xs text-gray-500">
                              Status: {currentPayout.status}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No payout found</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-800 text-sm">
                        {rider.accountDeactivated ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Deactivated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-800 text-sm">
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            type="button"
                            onClick={() => handleViewBlockedRiderPayouts(rider)}
                            className="px-3 py-1 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 transition-colors text-xs font-medium"
                          >
                            View payouts
                          </button>
                          {!rider.accountDeactivated && (
                            <button
                              type="button"
                              onClick={() => handleUnblockRider(rider._id)}
                              disabled={blockedActionLoading === rider._id}
                              className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {blockedActionLoading === rider._id ? 'Processing...' : 'Unblock'}
                            </button>
                          )}
                          {rider.accountDeactivated ? (
                            <button
                              type="button"
                              onClick={() => handleReactivateRider(rider._id)}
                              disabled={blockedActionLoading === rider._id}
                              className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {blockedActionLoading === rider._id
                                ? 'Processing...'
                                : 'Reactivate'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeactivateRider(rider._id)}
                              disabled={blockedActionLoading === rider._id}
                              className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {blockedActionLoading === rider._id
                                ? 'Processing...'
                                : 'Deactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderPayouts;
