import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  BanknotesIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { getOrderAuditReview } from '../services/paymentApi';
import Loader from './Loader';

const FinancialAuditModal = ({ isOpen, onClose, orderId }) => {
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchFinancialReview();
    }
  }, [isOpen, orderId]);

  const fetchFinancialReview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderAuditReview(orderId);
      if (data.success) {
        setFinancials(data.order.financials); 
      } else {
        setError(data.error || 'Failed to fetch financial audit data');
      }
    } catch (err) {
      console.error('Audit fetch error:', err);
      setError(err.response?.data?.error || 'Target order for audit not found or calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              Financial Audit Review
            </h2>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Order Reconciliation</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="py-12">
               <Loader />
               <p className="text-center text-sm font-bold text-neutral-500 mt-4">Analyzing financial flow...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-6 rounded-3xl inline-block mb-4">
                <InformationCircleIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="font-bold">{error}</p>
              </div>
              <button 
                onClick={fetchFinancialReview}
                className="block mx-auto text-blue-600 font-bold hover:underline"
              >
                Retry Audit
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Totals Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-[2rem] p-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-black mb-1 flex items-center gap-1">
                      <BanknotesIcon className="w-3 h-3" />
                      Gross Revenue
                    </p>
                    <p className="text-3xl font-black text-black dark:text-white">₦{financials.gross?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500 uppercase font-black mb-1 flex items-center justify-end gap-1">
                      <UserGroupIcon className="w-3 h-3" />
                      Rider Payout
                    </p>
                    <p className="text-3xl font-black text-green-600">₦{financials.riderNet?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 flex items-center gap-4">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
                      <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                   </div>
                   <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">Platform Commission</p>
                      <p className="text-lg font-black text-black dark:text-white">₦{financials.commissionAmount?.toLocaleString()}</p>
                   </div>
                </div>

                <div className="border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 flex items-center gap-4">
                   <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl">
                      <GiftIcon className="w-6 h-6 text-orange-600" />
                   </div>
                   <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">Rewards Deducted</p>
                      <p className="text-lg font-black text-black dark:text-white">₦{financials.rewardsUsed?.toLocaleString() || 0}</p>
                   </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex items-center gap-3 ${financials.wasRiderPaid ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}`}>
                {financials.wasRiderPaid ? (
                   <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                ) : (
                   <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-xs font-bold">
                  {financials.wasRiderPaid 
                    ? "Rider has already been settled for this order." 
                    : "Rider is pending settlement. Verification will credit their wallet."}
                </p>
              </div>

              {/* Action */}
              <button 
                onClick={onClose}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm hover:opacity-90 transition-all uppercase tracking-widest"
              >
                Close Audit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAuditModal;
