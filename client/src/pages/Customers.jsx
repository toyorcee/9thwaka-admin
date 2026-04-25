import { 
  UserCircleIcon, 
  WalletIcon, 
  ShoppingBagIcon, 
  StarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const Customers = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filters, setFilters] = useState({
    search: initialSearch,
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await getAllCustomers(filters);
        const baseCustomers = response.customers || [];
        setPagination(response.pagination || {});

        const customersWithPresence = await Promise.all(
          baseCustomers.map(async (customer) => {
            try {
              const presenceResponse = await getUserPresence(customer._id);
              const presence = presenceResponse?.presence || {};
              const online = !!presence.online;
              const lastSeen = presence.lastSeen || null;
              return { ...customer, online, lastSeen };
            } catch {
              return { ...customer, online: false, lastSeen: null };
            }
          })
        );

        setCustomers(customersWithPresence);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [filters]);

  const refreshData = () => {
    setFilters(prev => ({ ...prev }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  return (
    <div className="p-8 h-full bg-slate-50/50 dark:bg-neutral-950">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-black dark:text-white tracking-tight mb-2">Customers</h1>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">
            User Population & Identity Management
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              name="search"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] pl-12 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-24">
           <Loader />
           <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 animate-pulse">Syncing Customer Database...</p>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          type="customers"
          title="No customers yet"
          description="Once people start placing orders on your platform, their customer profiles will appear here."
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="py-5 px-6 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Customer</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Tier</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Orders</th>
                  <th className="py-5 px-6 text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Spent</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  <th className="py-5 px-6 text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {customers.map((customer) => {
                const stats = customer.stats || {};
                return (
                  <tr key={customer._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="py-5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {customer.profilePicture ? (
                            <img src={customer.profilePicture} alt="" className="w-12 h-12 rounded-2xl object-cover border border-neutral-100 dark:border-neutral-800" />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <UserCircleIcon className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${customer.online ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                        </div>
                        <div>
                          <p className="text-sm font-black text-black dark:text-white leading-none mb-1 group-hover:text-blue-600 transition-colors">{customer.fullName || 'Anonymous User'}</p>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                        <span className={`px-4 py-1.5 text-[10px] font-black rounded-lg border uppercase tracking-widest ${
                            customer.tier === 3 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            customer.tier === 2 ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                            customer.tier === 1 ? "bg-blue-50 text-blue-700 border-blue-100" :
                            "bg-neutral-50 text-neutral-500 border-neutral-100"
                        }`}>
                            T{customer.tier || 0}
                        </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-black dark:text-white leading-none">{stats.totalOrders || 0}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter mt-1">Orders</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right font-black text-sm text-black dark:text-white tracking-tight">
                       {formatCurrency(stats.totalSpent)}
                    </td>
                    <td className="py-5 px-6 text-center">
                      {customer.accountDeactivated ? (
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100 italic">Deactivated</span>
                      ) : customer.online ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Active Now</span>
                      ) : (
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-full">Offline</span>
                      )}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button
                        onClick={() => handleViewDetails(customer)}
                        className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 flex justify-between items-center px-4">
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Showing Page <span className="text-black dark:text-white">{pagination.page}</span> of {pagination.totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            disabled={!pagination.hasPrevPage}
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-all disabled:opacity-30 shadow-sm"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            disabled={!pagination.hasNextPage}
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-all disabled:opacity-30 shadow-sm"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <CustomerDetailsModal customer={selectedCustomer} onClose={handleCloseModal} onUpdate={refreshData} />
    </div>
  );
};

export default Customers;
