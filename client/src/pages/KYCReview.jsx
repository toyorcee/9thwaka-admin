import React, { useState, useEffect, useMemo } from "react";
import Table from "../components/Table";
import Skeleton from "../components/Skeleton";
import KYCDetailsModal from "../components/KYCDetailsModal";
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    UserIcon, 
    ShieldCheckIcon,
    CheckBadgeIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArchiveBoxIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon as ShieldCheckIconSolid } from "@heroicons/react/24/solid";
import { getPendingKYCUsers } from "../services/adminApi";

const KYCReview = () => {
    const [activeTab, setActiveTab] = useState("tier2"); 
    const [kycData, setKycData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [archiveMode, setArchiveMode] = useState(false);
    const [error, setError] = useState("");

    const loadKYCData = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getPendingKYCUsers(true);
            if (data.success) {
                setKycData(data.users);
            } else {
                setError(data.error || "Failed to fetch KYC data");
            }
        } catch (err) {
            console.error("Error fetching KYC data:", err);
            setError("Network error fetching KYC data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKYCData();
    }, []);

    const filteredData = useMemo(() => {
        let filtered = kycData;

        // Filter by tab
        if (activeTab === "tier1") {
            filtered = kycData.filter(user => user.tier === 1 && !user.is9thWakaVerified);
        } else if (activeTab === "tier2") {
            filtered = kycData.filter(user => {
                const hasIdentityDocs = user.kycDocuments?.selfie || (user.role === 'rider' ? user.driverLicensePicture : (user.kycDocuments?.bvnImage || user.kycDocuments?.ninImage));
                return hasIdentityDocs && user.kycStatus === 'pending' && user.tier < 2;
            });
        } else if (activeTab === "tier3") {
            filtered = kycData.filter(user => 
                (user.kycDocuments?.proofOfAddress && !user.addressVerified) || 
                (user.role === 'rider' && (
                    (user.kycDocuments?.hackneyPermit && !user.hackneyVerified) || 
                    (user.kycDocuments?.insurancePolicy && !user.insuranceVerified)
                ))
            );
        } else if (activeTab === "verified") {
            filtered = kycData.filter(user => user.is9thWakaVerified);
        }

        // Filter by archive mode (unless explicitly viewing verified or all)
        if (!archiveMode && activeTab !== "verified" && activeTab !== "all") {
             filtered = filtered.filter(user => user.kycStatus === 'pending');
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user => 
                user.fullName?.toLowerCase().includes(query) || 
                user.email?.toLowerCase().includes(query) ||
                user.phoneNumber?.includes(query) ||
                user.nin?.includes(query) ||
                user.bvn?.includes(query)
            );
        }

        return filtered;
    }, [kycData, activeTab, searchQuery, archiveMode]);

    const columns = [
        {
            header: "User Details",
            accessor: (user) => (
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img
                            src={user.profilePicture || "https://via.placeholder.com/40"}
                            alt={user.fullName}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40?text=NP"; }}
                        />
                        {user.is9thWakaVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full border-2 border-white p-0.5 shadow-sm">
                                <CheckBadgeIcon className="h-2.5 w-2.5 text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 leading-none">{user.fullName}</span>
                            {user.is9thWakaVerified && (
                                 <ShieldCheckIconSolid className="h-4 w-4 text-indigo-600" title="9thWaka Verified" />
                            )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{user.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: "Tier & Role",
            accessor: (user) => (
                <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                        user.tier === 3 ? "text-emerald-600" : 
                        user.tier === 2 ? "text-purple-600" : "text-blue-600"
                    }`}>
                        Tier {user.tier || 1}
                    </span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{user.role}</span>
                </div>
            ),
        },
        {
            header: "Status",
            accessor: (user) => {
                const status = user.kycStatus || "pending";
                const colors = {
                    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    pending: "bg-amber-50 text-amber-700 border-amber-100",
                    rejected: "bg-rose-50 text-rose-700 border-rose-100",
                    revoked: "bg-gray-50 text-gray-700 border-gray-100"
                };

                return (
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${colors[status] || colors.pending}`}>
                            {status}
                        </span>
                        {user.kycUpdateReason && (
                             <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" title="Update Requested" />
                        )}
                    </div>
                );
            },
        },
        {
            header: "Submission",
            accessor: (user) => (
                <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-bold">
                    <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A"}</span>
                </div>
            ),
        },
        {
            header: "Actions",
            accessor: (user) => (
                <button
                    onClick={() => {
                        setSelectedUser(user);
                        setIsModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
                >
                    <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                    <span>Review</span>
                </button>
            ),
        },
    ];

    return (
        <div className="p-8 min-h-screen bg-slate-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center">
                        <ShieldCheckIcon className="h-10 w-10 mr-3 text-indigo-600" />
                        Compliance Hub
                    </h1>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
                        Platform-wide Identity & Residency Verification Control
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by name, email, NIN..."
                            className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-80 shadow-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={loadKYCData}
                        className="p-3 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:rotate-180 duration-500"
                        title="Synchronize Data"
                    >
                        <ArrowPathIcon className={`h-6 w-6 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-neutral-200/50 backdrop-blur-md rounded-[2.5rem] w-fit shadow-inner">
                {[
                    { id: "tier2", label: "Tier 2 Queue", icon: UserIcon, color: "indigo" },
                    { id: "tier3", label: "Tier 3 Queue", icon: ShieldCheckIcon, color: "purple" },
                    { id: "tier1", label: "Unverified", icon: ClockIcon, color: "slate" },
                    { id: "verified", label: "Verified Hub", icon: CheckBadgeIcon, color: "emerald" },
                    { id: "all", label: "Global Audit", icon: FunnelIcon, color: "amber" }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id
                                ? `bg-white text-${tab.color}-600 shadow-xl shadow-${tab.color}-200/40 scale-[1.05]`
                                : "text-neutral-500 hover:bg-white/40"
                        }`}
                    >
                        <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? `text-${tab.color}-600` : 'text-neutral-400'}`} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Sub-Header / Filters */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-neutral-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Queue State:</span>
                        <button
                            onClick={() => setArchiveMode(!archiveMode)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                archiveMode 
                                    ? "bg-slate-900 text-white" 
                                    : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            }`}
                        >
                            <ArchiveBoxIcon className="h-3 w-3" />
                            <span>{archiveMode ? "Audit History" : "Pending Queue"}</span>
                        </button>
                    </div>
                    
                    {!archiveMode && activeTab !== 'verified' && (
                        <div className="flex items-center bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-ping" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                                Live Action Required
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className="h-10 w-[1px] bg-neutral-200" />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Total Records</p>
                        <p className="text-xl font-black text-slate-900 leading-none">{filteredData.length}</p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 animate-bounce">
                    <XCircleIcon className="h-6 w-6 text-rose-500" />
                    <p className="text-xs font-black text-rose-700 uppercase tracking-widest">{error}</p>
                </div>
            )}

            {/* Main Table Container */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-neutral-100 overflow-hidden group">
                <Table
                    columns={columns}
                    data={filteredData}
                    loading={loading}
                />
                
                {/* Empty State */}
                {!loading && filteredData.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-10 animate-pulse" />
                            <div className="bg-white p-8 rounded-full shadow-xl relative z-10 border border-neutral-50">
                                <ShieldCheckIcon className="h-16 w-16 text-neutral-200" />
                            </div>
                            <CheckCircleIcon className="absolute -bottom-2 -right-2 h-8 w-8 text-emerald-500 bg-white rounded-full border-4 border-white shadow-lg" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Queue Pristine</h3>
                        <p className="text-sm text-neutral-400 mt-2 max-w-xs font-medium">
                            No submissions found matching your current filter set. Everything is in order.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Layer */}
            {selectedUser && (
                <KYCDetailsModal
                    user={selectedUser}
                    isOpen={isModalOpen}
                    activeTab={activeTab}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onApproveSuccess={() => {
                        loadKYCData();
                        setIsModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onRejectSuccess={() => {
                        loadKYCData();
                        setIsModalOpen(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

export default KYCReview;
