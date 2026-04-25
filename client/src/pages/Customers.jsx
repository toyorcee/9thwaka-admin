import React, { useState, useEffect } from "react";
import { 
  UsersIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";
import { getCustomers } from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import CustomerDetailsModal from "../components/CustomerDetailsModal";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalCustomers: 0,
    });
  
    const [filters, setFilters] = useState({
        search: "",
        tier: "",
        limit: 10,
        page: 1
    });

    const [selectedCustomer, setSelectedCustomer] = useState(null);
  
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const data = await getCustomers(filters);
                setCustomers(data.customers || []);
                setPagination(data.pagination || { page: 1, totalPages: 1, totalCustomers: 0 });
            } catch (error) {
                console.error("Error fetching customers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, [filters]);
  
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const handleViewDetails = (customer) => setSelectedCustomer(customer);
    const handleCloseModal = () => setSelectedCustomer(null);
    const refreshData = () => setFilters(prev => ({ ...prev }));

    // Early return for loading state
    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col items-center justify-center">
                <Loader />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 animate-pulse">Syncing Customer Database...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2 flex items-center gap-3">
                        <UsersIcon className="w-10 h-10 text-blue-600" />
                        Customers
                    </h1>
                    <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-[0.2em]">Platform User Directory & Growth Statistics</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-4 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            name="search"
                            placeholder="Search by name, email or phone..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="relative group">
                            <AdjustmentsHorizontalIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <select
                                name="tier"
                                value={filters.tier}
                                onChange={handleFilterChange}
                                className="pl-12 pr-10 py-4 bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Tiers</option>
                                <option value="1">Tier 1</option>
                                <option value="2">Tier 2</option>
                                <option value="3">Tier 3</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Table or Empty State */}
            {customers.length === 0 ? (
                <EmptyState
                    type="customers"
                    title="No customers yet"
                    description="Once people start placing orders on your platform, their customer profiles will appear here."
                />
            ) : (
                <React.Fragment>
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-sm overflow-hidden text-black dark:text-white">
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
                                    {customers.map((customer) => (
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
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-black dark:text-white leading-none mb-1 group-hover:text-blue-600 transition-colors">{customer.fullName || 'User'}</p>
                                                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{customer.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-lg border uppercase tracking-widest ${
                                                    customer.tier === 3 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    customer.tier === 2 ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                                    "bg-blue-50 text-blue-700 border-blue-100"
                                                }`}>
                                                    T{customer.tier || 1}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ShoppingBagIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-[10px] font-black">{customer.stats?.ordersCount || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-[10px] font-black tracking-wider">₦{(customer.stats?.totalSpent || 0).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                {customer.accountDeactivated ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-200 animate-pulse">Blocked</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Active</span>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-between items-center px-4">
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                Showing Page <span className="text-black dark:text-white">{pagination.page}</span> of {pagination.totalPages}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFilters(f => ({ ...f, page: pagination.page - 1 }))}
                                disabled={!pagination.hasPrevPage}
                                className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-all disabled:opacity-30 shadow-sm"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setFilters(f => ({ ...f, page: pagination.page + 1 }))}
                                disabled={!pagination.hasNextPage}
                                className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-all disabled:opacity-30 shadow-sm"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </React.Fragment>
            )}
            
            <CustomerDetailsModal 
                customer={selectedCustomer} 
                onClose={handleCloseModal} 
                onUpdate={refreshData} 
            />
        </div>
    );
};

export default Customers;
