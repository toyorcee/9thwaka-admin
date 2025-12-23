import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { CheckCircleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  getAdminReferralStats,
  getPaidReferrals,
  getPendingReferrals,
  getReferralsByReferrer,
} from '../services/adminApi';

const ReferrerDetailsModal = ({ isOpen, onClose, details }) => {
  if (!isOpen || !details) return null;

  const { referrer, requiredTrips, rewardAmount, referrals } = details;

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

  const getStatusContent = (referral) => {
    const completed = referral.completedTrips || 0;
    const remaining = Math.max(0, (requiredTrips || 2) - completed);

    if (completed >= requiredTrips) {
      const label = referral.rewardPaid
        ? `Paid to referrer (${formatCurrency(referral.rewardAmount || rewardAmount)})`
        : `Eligible - pending payment to referrer (${formatCurrency(
            referral.rewardAmount || rewardAmount
          )})`;

      return {
        icon: CheckCircleIcon,
        color: 'text-green-600',
        label,
        badge: 'Trips completed',
      };
    }

    const tripsText = remaining === 1 ? 'trip' : 'trips';

    return {
      icon: ClockIcon,
      color: 'text-yellow-600',
      label: `${remaining} more ${tripsText} to credit ${formatCurrency(
        rewardAmount
      )} to the referrer`,
      badge: 'In progress',
    };
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Referees</h2>
            <p className="text-sm text-gray-500 mt-1">
              Referrals for {referrer?.name} ({referrer?.referralCode})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 flex items-center space-x-1"
          >
            <span className="text-sm">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Required trips per referee:{' '}
            <span className="font-semibold text-gray-800">{requiredTrips}</span>
          </p>
          <p className="text-sm text-gray-600">
            Reward per completed referee:{' '}
            <span className="font-semibold text-gray-800">
              {formatCurrency(rewardAmount)}
            </span>
          </p>
        </div>

        {referrals.length === 0 ? (
          <p className="text-gray-600 text-sm">
            This referrer has no referees yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                    Referee
                  </th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                    Contact
                  </th>
                  <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                    Completed Trips
                  </th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                    Payment
                  </th>
                  <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                    Referred At
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => {
                  const status = getStatusContent(referral);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={referral.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-800">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {referral.referredUser?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {referral.referredUser?.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        <div className="flex flex-col text-sm">
                          <span>{referral.referredUser?.email}</span>
                          <span className="text-gray-500">
                            {referral.referredUser?.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-800">
                        {referral.completedTrips}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">
                              {status.badge}
                            </span>
                            <span className="text-xs text-gray-600">
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {referral.rewardPaid ? (
                          <div className="flex flex-col text-sm text-green-600">
                            <span className="font-semibold">
                              {formatCurrency(
                                referral.rewardAmount || rewardAmount
                              )}
                            </span>
                            <span className="text-xs text-gray-600">
                              Paid to referrer
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-yellow-600">
                            Not yet paid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">
                        {formatDateTime(referral.createdAt)}
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

const Referrals = () => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingReferrals, setPendingReferrals] = useState([]);
  const [paidReferrals, setPaidReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paidPagination, setPaidPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  });
  const [referrerModalOpen, setReferrerModalOpen] = useState(false);
  const [referrerDetails, setReferrerDetails] = useState(null);
  const [referrerModalLoading, setReferrerModalLoading] = useState(false);
  const [referrerModalError, setReferrerModalError] = useState(null);

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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, pendingResponse] = await Promise.all([
          getAdminReferralStats(),
          getPendingReferrals(),
        ]);

        setStats(statsResponse.stats || null);
        setPendingReferrals(pendingResponse.referrals || []);
      } catch (e) {
        setError('Failed to load referral data.');
        console.error('Failed to load referral data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchPaidReferrals = async () => {
      if (activeTab !== 'paid') {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getPaidReferrals({
          page: paidPagination.page,
          limit: paidPagination.limit,
        });

        setPaidReferrals(response.referrals || []);
        setPaidPagination((prev) => ({
          ...prev,
          page: response.page || prev.page,
          limit: response.limit || prev.limit,
          totalPages: response.totalPages || prev.totalPages,
          total: response.total || prev.total,
        }));
      } catch (e) {
        setError('Failed to load paid referral rewards.');
        console.error('Failed to load paid referral rewards:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPaidReferrals();
  }, [activeTab, paidPagination.page, paidPagination.limit]);

  const handleChangePage = (direction) => {
    setPaidPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1;
      if (nextPage < 1 || nextPage > prev.totalPages) {
        return prev;
      }
      return { ...prev, page: nextPage };
    });
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <p className="text-2xl font-semibold text-gray-800">{stats.totalReferrals}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Pending Rewards</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.pendingRewards}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Paid Rewards</p>
          <p className="text-2xl font-semibold text-green-600">{stats.paidRewards}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Total Reward Amount Paid</p>
          <p className="text-2xl font-semibold text-gray-800">
            {formatCurrency(stats.totalRewardAmountPaid)}
          </p>
        </div>
      </div>
    );
  };

  const renderPendingTable = () => {
    if (pendingReferrals.length === 0) {
      return (
        <EmptyState
          type="referrals"
          title="No pending referral rewards"
          description="When referred users complete eligible trips, their pending rewards will show up here for review."
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referrer</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referrer Email</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referrer Phone</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referral Code</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referred User</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referred Email</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referred Phone</th>
              <th className="py-3 px-4 text-center text-gray-600 font-semibold">Completed Trips</th>
              <th className="py-3 px-4 text-right text-gray-600 font-semibold">Reward Amount</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Created At</th>
              <th className="py-3 px-4 text-center text-gray-600 font-semibold">Referees</th>
            </tr>
          </thead>
          <tbody>
            {pendingReferrals.map((referral) => (
              <tr key={referral.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-800">{referral.referrer?.name}</td>
                <td className="py-3 px-4 text-gray-800">{referral.referrer?.email}</td>
                <td className="py-3 px-4 text-gray-800">{referral.referrer?.phone}</td>
                <td className="py-3 px-4 text-gray-800">{referral.referrer?.referralCode}</td>
                <td className="py-3 px-4 text-gray-800">{referral.referredUser?.name}</td>
                <td className="py-3 px-4 text-gray-800">{referral.referredUser?.email}</td>
                <td className="py-3 px-4 text-gray-800">{referral.referredUser?.phone}</td>
                <td className="py-3 px-4 text-center text-gray-800">
                  {referral.completedTrips}
                </td>
                <td className="py-3 px-4 text-right text-gray-800">
                  {formatCurrency(referral.rewardAmount)}
                </td>
                <td className="py-3 px-4 text-gray-800">
                  {formatDateTime(referral.createdAt)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleViewReferees(referral.referrer?.id)}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition duration-300"
                    disabled={!referral.referrer?.id}
                  >
                    View referees
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPaidTable = () => {
    if (paidReferrals.length === 0) {
      return (
        <EmptyState
          type="referrals"
          title="No paid referral rewards"
          description="Once referral rewards are paid out, the payment history will appear here."
        />
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referrer</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referrer Email</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referrer Phone</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referral Code</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referred User</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referred Email</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Referred Phone</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Completed Trips</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">Reward Amount</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Paid At</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {paidReferrals.map((referral) => (
                <tr key={referral.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{referral.referrer?.name}</td>
                  <td className="py-3 px-4 text-gray-800">{referral.referrer?.email}</td>
                  <td className="py-3 px-4 text-gray-800">{referral.referrer?.phone}</td>
                  <td className="py-3 px-4 text-gray-800">{referral.referrer?.referralCode}</td>
                  <td className="py-3 px-4 text-gray-800">{referral.referredUser?.name}</td>
                  <td className="py-3 px-4 text-gray-800">{referral.referredUser?.email}</td>
                  <td className="py-3 px-4 text-gray-800">{referral.referredUser?.phone}</td>
                  <td className="py-3 px-4 text-center text-gray-800">
                    {referral.completedTrips}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-800">
                    {formatCurrency(referral.rewardAmount)}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{formatDateTime(referral.paidAt)}</td>
                  <td className="py-3 px-4 text-gray-800">
                    {referral.transactionId || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 mb-6 flex justify-between items-center text-gray-800">
          <div>
            <p>
              Page {paidPagination.page} of {paidPagination.totalPages}
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => handleChangePage('prev')}
              disabled={paidPagination.page <= 1}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handleChangePage('next')}
              disabled={paidPagination.page >= paidPagination.totalPages}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg ml-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  };

  const handleViewReferees = async (referrerId) => {
    if (!referrerId) return;
    try {
      setReferrerModalLoading(true);
      setReferrerModalError(null);
      const data = await getReferralsByReferrer(referrerId);
      if (!data || data.success === false) {
        setReferrerModalError(
          data?.error || 'Failed to load referee details.'
        );
        return;
      }
      setReferrerDetails({
        referrer: data.referrer,
        requiredTrips: data.requiredTrips,
        rewardAmount: data.rewardAmount,
        referrals: data.referrals || [],
      });
      setReferrerModalOpen(true);
    } catch (e) {
      setReferrerModalError('Failed to load referee details.');
      console.error('Failed to load referee details:', e);
    } finally {
      setReferrerModalLoading(false);
    }
  };

  const handleCloseReferrerModal = () => {
    setReferrerModalOpen(false);
    setReferrerDetails(null);
    setReferrerModalError(null);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Referrals</h1>

      {error && <p className="mb-4 text-red-500">{error}</p>}
      {referrerModalError && (
        <p className="mb-4 text-red-500">{referrerModalError}</p>
      )}

      {renderStats()}

      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'pending'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          Pending Rewards
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'paid'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          Paid Rewards
        </button>
      </div>

      {activeTab === 'pending' ? renderPendingTable() : renderPaidTable()}

      <ReferrerDetailsModal
        isOpen={referrerModalOpen}
        onClose={handleCloseReferrerModal}
        details={referrerDetails}
      />
      {referrerModalLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 backdrop-blur-sm z-40">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Referrals;
