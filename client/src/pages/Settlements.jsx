import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  InformationCircleIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
  CubeIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { getPendingSettlements, verifySettlement } from '../services/paymentApi';
import Loader from '../components/Loader';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import FinancialAuditModal from '../components/FinancialAuditModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import SettlementChart from '../components/charts/SettlementChart';
import { toast } from 'react-toastify';

const SettlementSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 mb-6">
    <div className="flex justify-between items-start mb-8">
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-48 h-8" />
        </div>
      </div>
      <Skeleton className="w-24 h-10" />
    </div>
    <div className="grid grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
    </div>
    <div className="flex gap-4">
      <Skeleton className="flex-1 h-12 rounded-2xl" />
      <Skeleton className="flex-1 h-12 rounded-2xl" />
      <Skeleton className="flex-1 h-12 rounded-2xl" />
    </div>
  </div>
);

const StatCard = ({ title, amount, icon: Icon, color, subtitle, trend, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between h-56">
        <div className="flex justify-between items-start">
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-32 h-10" />
          <Skeleton className="w-40 h-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all border-b-4 relative overflow-hidden group" style={{ borderBottomColor: color.split(' ')[0].replace('bg-', '') }}>
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-4 rounded-[1.5rem] ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${trend > 0 ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
            {trend > 0 ? `+${trend}%` : 'Stable'}
          </span>
        )}
      </div>
      <div className="mt-6 relative z-10">
        <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest leading-none mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-black dark:text-white tracking-tight">₦{amount?.toLocaleString()}</span>
        </div>
        {subtitle && <p className="text-[10px] text-neutral-500 font-bold uppercase mt-2 tracking-wider">{subtitle}</p>}
      </div>
    </div>
  );
};

const SettlementCard = ({ order, onVerify, onAudit, onViewDetails }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-black/5 dark:hover:border-white/5 transition-all duration-500 mb-6 group">
      <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-4">
        <div className="flex items-start gap-4">
           {/* Transition Status Icon */}
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${order.payment?.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 animate-pulse'}`}>
              <ArrowPathIcon className="w-6 h-6" />
           </div>
           <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                  Order #{order.orderId}
                </span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${order.serviceType === 'ride' ? 'text-violet-600 bg-violet-50 border-violet-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                  {order.serviceType}
                </span>
              </div>
              <h3 className="text-2xl font-black text-black dark:text-white mt-1 group-hover:text-blue-600 transition-colors">
                {order.items || "Package Delivery"}
              </h3>
              <div className="flex items-center gap-3 mt-2">
                 <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{new Date(order.createdAt).toLocaleString()}</p>
                 <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                 <p className="text-xs text-neutral-400 font-bold">{order.customerId?.fullName}</p>
              </div>
           </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-black dark:text-white tracking-tighter">₦{order.price?.toLocaleString()}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
             <div className={`w-2 h-2 rounded-full ${order.payment?.status === 'paid' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
             <span className={`text-[10px] font-black uppercase tracking-widest ${
               order.payment?.status === 'paid' ? 'text-green-700' : 'text-orange-700'
             }`}>
               {order.payment?.status?.toUpperCase()}
             </span>
          </div>
        </div>
      </div>

      {/* Financial Split Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-neutral-50 dark:bg-neutral-800/40 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 mb-8">
        <div className="space-y-1">
          <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">Gross Price</p>
          <p className="text-lg font-black text-black dark:text-white">₦{order.price?.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">Commission ({order.financial?.commissionRatePct || 0}%)</p>
          <p className="text-lg font-black text-blue-600">₦{order.financial?.commissionAmount?.toLocaleString() || 0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">Rider Net</p>
          <p className="text-lg font-black text-green-600">₦{order.financial?.riderNetAmount?.toLocaleString() || 0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">Rewards / Deposit</p>
          <p className="text-lg font-black text-orange-600">₦{(order.payment?.rewardAmountUsed || 0) + (order.payment?.depositAmountUsed || 0)}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {order.payment?.status !== 'paid' ? (
           <button 
             onClick={() => onVerify(order._id)}
             className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10 uppercase tracking-widest"
           >
             <CheckCircleIcon className="w-5 h-5" />
             VERIFY & SETTLE
           </button>
        ) : (
           <div className="flex-1 bg-green-50 dark:bg-green-900/10 text-green-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 border border-green-100 dark:border-green-900/30 uppercase tracking-widest">
              <CheckCircleIcon className="w-5 h-5" />
              SETTLED
           </div>
        )}
        <button 
           onClick={() => onAudit(order._id)}
           className="flex-1 bg-blue-50 dark:bg-blue-900/10 text-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-3 border border-blue-100 dark:border-blue-900/30 uppercase tracking-widest"
        >
          <ShieldCheckIcon className="w-5 h-5" />
          DEEP AUDIT
        </button>
        <button 
          onClick={() => onViewDetails(order._id)}
          className="flex-1 border border-neutral-200 dark:border-neutral-700 py-4 rounded-2xl font-black text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-3 uppercase tracking-widest"
        >
          <EyeIcon className="w-5 h-5" />
          RECEIPT
        </button>
        <button 
          onClick={() => toast.info('Order flagged for audit review. Our team will contact the rider.')}
          className="p-4 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
          title="Flag for Suspicious Activity"
        >
          <ExclamationTriangleIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const Settlements = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ 
    revenueToday: 0, 
    revenueWeek: 0, 
    revenueRange: 0, 
    settledRange: 0, 
    totalOwedToRiders: 0, 
    potentialCommission: 0, 
    pendingCount: 0,
    trend: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalOrders: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('month'); // day, week, month, year, custom
  
  const [auditOrderId, setAuditOrderId] = useState(null);
  const [detailsOrderId, setDetailsOrderId] = useState(null);

  const getRangeDates = (range) => {
    const end = new Date();
    const start = new Date();
    
    if (range === 'day') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchSettlements = async (page = 1) => {
    try {
      setLoading(page === 1);
      setRefreshing(page !== 1);
      const { start, end } = getRangeDates(dateRange);
      const data = await getPendingSettlements(page, searchTerm, start, end);
      if (data.success) {
        setOrders(data.orders);
        setStats(data.stats || { 
          revenueToday: 0, 
          revenueWeek: 0, 
          revenueRange: 0, 
          settledRange: 0, 
          totalOwedToRiders: 0, 
          potentialCommission: 0, 
          pendingCount: 0,
          trend: []
        });
        setPagination({
          page: data.currentPage,
          totalPages: data.totalPages,
          totalOrders: data.totalOrders
        });
      }
    } catch (error) {
      console.error('Fetch settlements error:', error);
      toast.error('Failed to load pending settlements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettlements(1);
  }, [searchTerm, dateRange]);

  const handleVerify = async (orderId) => {
    if (!window.confirm('Are you sure you want to manually verify and settle this order? This will credit the rider wallet and mark the order as paid.')) return;
    
    try {
      toast.loading('Synchronizing financial movement...', { toastId: 'verify' });
      const data = await verifySettlement(orderId);
      
      if (data.success) {
        toast.update('verify', { 
          render: data.message || 'Order settled successfully!', 
          type: 'success', 
          isLoading: false, 
          autoClose: 3000 
        });
        fetchSettlements(pagination.page);
      } else {
         toast.update('verify', { 
          render: data.error || 'Verification failed', 
          type: 'error', 
          isLoading: false, 
          autoClose: 3000 
        });
      }
    } catch (error) {
      console.error('Verify error:', error);
       toast.update('verify', { 
        render: error.response?.data?.error || 'Verification action failed', 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-black/5">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
        <div className="flex-1">
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 w-2 h-8 rounded-full shadow-lg shadow-blue-500/40"></div>
              <h1 className="text-4xl font-black text-black dark:text-white tracking-tight">
                Settlements Console
              </h1>
           </div>
           <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] ml-5">
             RECONCILIATION & MANUAL VERIFICATION
           </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Period Selector */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-1 flex gap-1 shadow-sm">
             {['day', 'week', 'month', 'year'].map(p => (
                <button
                  key={p}
                  onClick={() => setDateRange(p)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === p ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'text-neutral-400 hover:text-black dark:hover:text-white'}`}
                >
                  {p}
                </button>
             ))}
          </div>

          <div className="relative flex-1 md:w-80 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search ID, Rider, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] pl-12 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
            />
          </div>
          <button 
            onClick={() => fetchSettlements(pagination.page)}
            className={`p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm ${refreshing ? 'animate-spin' : ''}`}
          >
            <ArrowPathIcon className="w-6 h-6 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
        <StatCard 
          title="Period Revenue" 
          amount={stats.revenueRange} 
          icon={BanknotesIcon} 
          color="bg-blue-600 shadow-lg shadow-blue-500/20"
          subtitle={`Commission for this ${dateRange}`}
          loading={loading}
        />
        <StatCard 
          title="Period Settled" 
          amount={stats.settledRange} 
          icon={CheckCircleIcon} 
          color="bg-emerald-600 shadow-lg shadow-emerald-500/20"
          subtitle={`Total paid in this ${dateRange}`}
          loading={loading}
        />
        <StatCard 
          title="Rider Debt (Global)" 
          amount={stats.totalOwedToRiders} 
          icon={ExclamationTriangleIcon} 
          color="bg-rose-600 shadow-lg shadow-rose-500/20"
          subtitle={`${stats.pendingCount} orders awaiting pay`}
          loading={loading}
        />
        <StatCard 
          title="Revenue (Today)" 
          amount={stats.revenueToday} 
          icon={BoltIcon} 
          color="bg-violet-600 shadow-lg shadow-violet-500/20"
          loading={loading}
        />
        <StatCard 
          title="Potential Revenue" 
          amount={stats.potentialCommission} 
          icon={ShieldCheckIcon} 
          color="bg-amber-600 shadow-lg shadow-amber-500/20"
          subtitle="From pending settlements"
          loading={loading}
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         {/* Chart Card */}
         <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 shadow-sm group">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Settlement Trend</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Platform commission trajectory</p>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Commission</span>
               </div>
            </div>
            <div className="h-[300px]">
               {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader />
                  </div>
               ) : (
                  <SettlementChart data={stats.trend} />
               )}
            </div>
         </div>

         {/* Reconciliation Progress Card */}
         <div className="bg-black dark:bg-white p-10 rounded-[2.5rem] text-white dark:text-black flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
               <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Reconciliation Progress</h3>
               <p className="text-4xl font-black tracking-tighter leading-none mb-6">
                 {stats.settledRange + stats.totalOwedToRiders > 0 
                  ? ((stats.settledRange / (stats.settledRange + stats.totalOwedToRiders)) * 100).toFixed(1)
                  : '0.0'}%
               </p>
               <div className="space-y-4">
                  <div className="space-y-1">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Paid out</span>
                        <span className="opacity-60">₦{stats.settledRange.toLocaleString()}</span>
                     </div>
                     <div className="h-2 w-full bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: `${(stats.settledRange / (stats.settledRange + stats.totalOwedToRiders)) * 100}%` }}
                        ></div>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Pending</span>
                        <span className="opacity-60">₦{stats.totalOwedToRiders.toLocaleString()}</span>
                     </div>
                     <div className="h-2 w-full bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-1000" 
                          style={{ width: `${(stats.totalOwedToRiders / (stats.settledRange + stats.totalOwedToRiders)) * 100}%` }}
                        ></div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
               <ShieldCheckIcon className="w-64 h-64" />
            </div>
            <div className="relative z-10 mt-8">
               <p className="text-[10px] font-bold opacity-60 leading-relaxed uppercase tracking-wider">
                 This percentage represents our current settlement health for the selected period.
               </p>
            </div>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => <SettlementSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12">
          <EmptyState 
            type="orders" 
            title="Clean Slate" 
            description="No pending settlements found. All delivered orders appear to be verified and settled." 
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => (
              <SettlementCard 
                key={order._id} 
                order={order} 
                onVerify={handleVerify}
                onAudit={setAuditOrderId}
                onViewDetails={setDetailsOrderId}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
             <div className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
                Page <span className="text-black dark:text-white">{pagination.page}</span> of {pagination.totalPages}
                <span className="ml-4 lowercase font-medium text-neutral-400">({pagination.totalOrders} total settlements pending)</span>
             </div>
             <div className="flex gap-2">
                <button 
                   disabled={pagination.page <= 1}
                   onClick={() => fetchSettlements(pagination.page - 1)}
                   className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                   <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button 
                   disabled={pagination.page >= pagination.totalPages}
                   onClick={() => fetchSettlements(pagination.page + 1)}
                   className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                   <ChevronRightIcon className="w-6 h-6" />
                </button>
             </div>
          </div>
        </>
      )}

      {/* Modals */}
      <FinancialAuditModal 
        isOpen={!!auditOrderId} 
        onClose={() => setAuditOrderId(null)} 
        orderId={auditOrderId} 
      />

      <OrderDetailsModal 
        orderId={detailsOrderId} 
        onClose={() => setDetailsOrderId(null)} 
      />
    </div>
  );
};

export default Settlements;
