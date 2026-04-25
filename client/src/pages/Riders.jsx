import { 
  UserCircleIcon, 
  MapPinIcon, 
  TruckIcon, 
  ShieldCheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const socket = io();

const Riders = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: initialSearch,
    blocked: false,
    verified: false,
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const fetchRidersAndOnlineStatus = async () => {
      try {
        setLoading(true);
        const response = await getAllRiders(filters);
        const ridersList = response?.riders || [];
        setPagination(response?.pagination || {});

        const { onlineRiderIds } = await getInitialRidersOnlineStatus();
        const ridersWithOnlineStatus = ridersList.map((rider) => ({
          ...rider,
          online: onlineRiderIds.includes(rider._id),
        }));

        setRiders(ridersWithOnlineStatus);
      } catch (error) {
        console.error('Failed to fetch riders or online status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRidersAndOnlineStatus();

    socket.on('user.online', ({ userId }) => {
      setRiders((prevRiders) =>
        prevRiders.map((rider) =>
          rider._id === userId ? { ...rider, online: true } : rider
        )
      );
    });

    socket.on('user.offline', ({ userId }) => {
      setRiders((prevRiders) =>
        prevRiders.map((rider) =>
          rider._id === userId ? { ...rider, online: false } : rider
        )
      );
    });

    return () => {
      socket.off('user.online');
      socket.off('user.offline');
    };
  }, [filters]);

  const handleViewDetails = async (rider) => {
    try {
      const presenceResponse = await getUserPresence(rider._id);
      const presence = presenceResponse?.presence || {};
      const online =
        typeof presence.online === 'boolean' ? presence.online : rider.online;
      const lastSeen = presence.lastSeen || null;
      setSelectedRider({ ...rider, online, lastSeen });
    } catch (error) {
      console.error('Failed to fetch rider presence:', error);
      setSelectedRider(rider);
    }
  };

  const handleCloseModal = () => {
    setSelectedRider(null);
  };

  const formatVehicleType = (vehicleType) => {
    if (!vehicleType) return 'N/A';
    return vehicleType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value, page: 1 }));
  };

  const refreshData = () => {
    setFilters(prev => ({ ...prev }));
  };

  return (
    <div className="p-8 h-full bg-slate-50/50 dark:bg-neutral-950">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8">
        <div>
           <h1 className="text-4xl font-black text-black dark:text-white tracking-tight mb-2">Courier Fleet</h1>
           <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">
             Rider Logistics & Verification Hub
           </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 md:w-80 min-w-[240px]">
             <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
             <input
               type="text"
               name="search"
               placeholder="Search fleet by name or ID..."
               value={filters.search}
               onChange={handleFilterChange}
               className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] pl-12 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
             />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] px-6 py-3 shadow-sm">
             <label className="flex items-center space-x-2 cursor-pointer group">
               <input
                 type="checkbox"
                 name="blocked"
                 checked={filters.blocked}
                 onChange={handleFilterChange}
                 className="w-4 h-4 rounded border-neutral-300 text-rose-600 focus:ring-rose-500 transition-all"
               />
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-rose-600 transition-colors">Blocked</span>
             </label>
             <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-2"></div>
             <label className="flex items-center space-x-2 cursor-pointer group">
               <input
                 type="checkbox"
                 name="verified"
                 checked={filters.verified}
                 onChange={handleFilterChange}
                 className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 transition-all"
               />
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-emerald-600 transition-colors">Verified</span>
             </label>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center py-24">
           <Loader />
           <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 animate-pulse">Syncing Rider Fleet...</p>
        </div>
      ) : riders.length === 0 ? (
        <EmptyState
          type="riders"
          title="No riders available"
          description="When riders complete registration and are approved, they will appear in this list."
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="py-5 px-6 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Rider Identity</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Vehicle</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Service</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Tier</th>
                  <th className="py-5 px-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  <th className="py-5 px-6 text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {riders.map((rider) => (
                <tr key={rider._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                  <td className="py-5 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {rider.profilePicture ? (
                          <img src={rider.profilePicture} alt="" className="w-12 h-12 rounded-2xl object-cover border border-neutral-100 dark:border-neutral-800" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <UserCircleIcon className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${rider.online ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-black dark:text-white leading-none mb-1 group-hover:text-blue-600 transition-colors">{rider.fullName || 'Rider'}</p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{rider.phoneNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                       <TruckIcon className="w-5 h-5 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                       <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{formatVehicleType(rider.vehicleType)}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest rounded-lg border border-neutral-200 dark:border-neutral-700">
                       {rider.preferredService || 'All'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className={`px-4 py-1.5 text-[10px] font-black rounded-lg border uppercase tracking-widest ${
                        rider.tier === 3 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        rider.tier === 2 ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                        T{rider.tier || 1}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    {rider.online ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Live & Sync</span>
                    ) : (
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-full">Disconnected</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <button
                      onClick={() => handleViewDetails(rider)}
                      className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-10 flex justify-between items-center px-4">
        <div>
           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
             Fleet Distribution Page <span className="text-black dark:text-white">{pagination.page}</span> of {pagination.totalPages}
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
      <RiderDetailsModal rider={selectedRider} onClose={handleCloseModal} onUpdate={refreshData} />
    </div>
  );
};

export default Riders;
