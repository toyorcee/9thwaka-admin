import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Skeleton from "../components/Skeleton";
import KYCDetailsModal from "../components/KYCDetailsModal";
import { CheckCircleIcon, XCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import { getPendingKYCUsers } from "../services/adminApi";
import { resolveImageUrl } from "../utils/urlHelper";

const KYCReview = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("tier2");
    const [showAll, setShowAll] = useState(false);

    const fetchKYCInfo = async () => {
        setLoading(true);
        try {
            const shouldFetchAll = showAll || activeTab === 'verified' || activeTab === 'all';
            const data = await getPendingKYCUsers(shouldFetchAll);
            if (data.success) {
                setUsers(data.users);
            } else {
                setError(data.error || "Failed to fetch KYC users");
            }
        } catch {
            setError("Network error fetching KYC users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKYCInfo();
    }, [showAll, activeTab]);

    const handleApprove = async (userId) => {
        if (!showAll && activeTab !== 'verified') setUsers(users.filter(u => u._id !== userId));
        else fetchKYCInfo();
        setSelectedUser(null);
    };

    const handleReject = async (userId) => {
         if (!showAll && activeTab !== 'verified') setUsers(users.filter(u => u._id !== userId));
         else fetchKYCInfo();
         setSelectedUser(null);
    };

    const handleRevoke = async (userId) => {
        fetchKYCInfo();
        setSelectedUser(null);
    };

    const filteredUsers = users.filter((u) => {
        if (activeTab === "all") {
            return true;
        }
        if (activeTab === "verified") {
            return u.kycStatus === 'rejected' || u.tier === 3 || (u.kycStatus === 'approved' && u.addressVerified);
        }
        if (activeTab === "tier3") {
            return (u.kycDocuments?.proofOfAddress && !u.addressVerified) || 
                   (u.role === 'rider' && (
                       (u.kycDocuments?.hackneyPermit && !u.hackneyVerified) || 
                       (u.kycDocuments?.insurancePolicy && !u.insuranceVerified)
                   ));
        }
        if (activeTab === "tier2") {
            const hasIdentityDocs = u.kycDocuments?.selfie || (u.role === 'rider' ? u.driverLicensePicture : (u.kycDocuments?.bvnImage || u.kycDocuments?.ninImage));
            return hasIdentityDocs && u.kycStatus === 'pending' && u.tier < 2;
        }
        return u.tier === 1 && u.kycStatus !== 'pending' && !u.kycDocuments?.selfie;
    });

    const columns = [
        { 
            header: "User", 
            accessor: (user) => (
                <div className="flex items-center space-x-3">
                    <img
                        src={resolveImageUrl(user.profilePicture || user.kycDocuments?.selfie)}
                        alt=""
                        className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/32"; }}
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 leading-tight">{user.fullName}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{user.email}</span>
                    </div>
                </div>
            )
        },
        { 
            header: "Documents", 
            accessor: (user) => {
                const hasSelfie = !!user.kycDocuments?.selfie;
                const hasID = user.role === 'rider' ? !!user.driverLicensePicture : (!!user.kycDocuments?.bvnImage || !!user.kycDocuments?.ninImage);
                const hasAddress = !!user.kycDocuments?.proofOfAddress;
                
                if (user.role === 'rider' && activeTab === 'tier3') {
                    const count = [(user.addressVerified ? 1 : 0), (user.hackneyVerified ? 1 : 0), (user.insuranceVerified ? 1 : 0)].filter(v => v === 1).length;
                    return (
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-1.5 mb-1">
                                <span title="Address" className={`w-2 h-2 rounded-full ${user.addressVerified ? 'bg-green-500' : 'bg-gray-200'}`}></span>
                                <span title="Hackney" className={`w-2 h-2 rounded-full ${user.hackneyVerified ? 'bg-green-500' : 'bg-gray-200'}`}></span>
                                <span title="Insurance" className={`w-2 h-2 rounded-full ${user.insuranceVerified ? 'bg-green-500' : 'bg-gray-200'}`}></span>
                            </div>
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter leading-none">
                                {count}/3 Compliance
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center space-x-1.5">
                        <span title="Selfie" className={`w-2.5 h-2.5 rounded-full ${hasSelfie ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-200'}`}></span>
                        <span title="ID Card" className={`w-2.5 h-2.5 rounded-full ${hasID ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-gray-200'}`}></span>
                        <span title="Address" className={`w-2.5 h-2.5 rounded-full ${hasAddress ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-gray-200'}`}></span>
                    </div>
                );
            }
        },
        { 
            header: "Tier", 
            accessor: (user) => {
                const tier = user.tier || 0;
                let colorClass = "bg-gray-100 text-gray-700";
                if (tier === 1) colorClass = "bg-blue-100 text-blue-700";
                if (tier === 2) colorClass = "bg-purple-100 text-purple-700 font-extrabold";
                if (tier === 3) colorClass = "bg-green-100 text-green-700 font-extrabold";
    
                return (
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-black rounded-lg ${colorClass}`}>
                        T{tier}
                    </span>
                );
            } 
        },
        { 
            header: "Status", 
            accessor: (user) => {
                const status = user.kycStatus === 'approved' ? 'Approved' : user.kycStatus === 'pending' ? 'Review' : user.kycStatus === 'rejected' ? 'Rejected' : 'None';
                const colors = user.kycStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                               user.kycStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' : 
                               user.kycStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                               'bg-gray-50 text-gray-700 border-gray-200';
                
                return (
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded capitalize ${colors}`}>
                        {status}
                    </span>
                );
            }
        },
        { header: "Role", accessor: (user) => <span className="capitalize font-medium text-gray-600 text-xs">{user.role}</span> },
        { header: "Updated", accessor: (user) => <span className="text-gray-400 text-[10px]">{new Date(user.updatedAt).toLocaleDateString()}</span> },
        {
            header: "Action",
            accessor: (user) => (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setSelectedUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-indigo-50 px-2 py-1 rounded transition-colors"
                    >
                        Review
                    </button>
                    {/* Pre-fetch images in background */}
                    <div className="hidden">
                        {user.kycDocuments?.selfie && <img src={resolveImageUrl(user.kycDocuments.selfie)} alt="" />}
                        {user.kycDocuments?.bvnImage && <img src={resolveImageUrl(user.kycDocuments.bvnImage)} alt="" />}
                        {user.kycDocuments?.ninImage && <img src={resolveImageUrl(user.kycDocuments.ninImage)} alt="" />}
                        {user.kycDocuments?.proofOfAddress && <img src={resolveImageUrl(user.kycDocuments.proofOfAddress)} alt="" />}
                        {user.driverLicensePicture && <img src={resolveImageUrl(user.driverLicensePicture)} alt="" />}
                    </div>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="grid grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                        </div>
                    </div>
                    <div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4 border-b border-gray-100 grid grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5].map(j => <Skeleton key={j} className="h-5 w-full" />)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50/50 dark:bg-neutral-950 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                   <h1 className="text-4xl font-black text-black dark:text-white tracking-tight mb-2">KYC Review Queue</h1>
                   <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">
                     Tiered Compliance & Identity Verification
                   </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 px-6 py-3 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Archive Mode</span>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            showAll ? "bg-emerald-500" : "bg-neutral-200"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                showAll ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Live Queue</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 bg-white overflow-hidden rounded-t-xl">
                <button
                    onClick={() => setActiveTab("tier1")}
                    className={`py-4 px-8 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "tier1" ? "border-slate-600 text-slate-800 bg-slate-50" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Tier 1 (Base)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'tier1' ? 'bg-slate-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {users.filter(u => u.tier === 1 && u.kycStatus !== 'pending' && !u.kycDocuments?.selfie).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("tier2")}
                    className={`py-4 px-8 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "tier2" ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Tier 2 (Identity)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'tier2' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {users.filter(u => {
                             const hasIdentityDocs = u.kycDocuments?.selfie || (u.role === 'rider' ? u.driverLicensePicture : (u.kycDocuments?.bvnImage || u.kycDocuments?.ninImage));
                             return hasIdentityDocs && u.kycStatus === 'pending' && u.tier < 2;
                        }).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("tier3")}
                    className={`py-4 px-8 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "tier3" ? "border-purple-600 text-purple-600 bg-purple-50" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Tier 3 (Residency)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'tier3' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {users.filter(u => (u.kycDocuments?.proofOfAddress && !u.addressVerified) || 
                                           (u.role === 'rider' && ((u.kycDocuments?.hackneyPermit && !u.hackneyVerified) || (u.kycDocuments?.insurancePolicy && !u.insuranceVerified)))
                        ).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("verified")}
                    className={`py-4 px-8 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "verified" ? "border-emerald-600 text-emerald-600 bg-emerald-50" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>Verified History</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'verified' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {users.filter(u => u.kycStatus === 'rejected' || u.tier === 3 || (u.kycStatus === 'approved' && u.addressVerified)).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={`py-4 px-8 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 flex items-center space-x-2 ${
                        activeTab === "all" ? "border-amber-600 text-amber-600 bg-amber-50" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <span>All Users (Global)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {users.length}
                    </span>
                </button>
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs font-bold">
                    {error}
                </div>
            )}

                {filteredUsers.length === 0 && !loading && !error ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 italic">
                    <CheckCircleIcon className="h-10 w-10 mx-auto text-green-500/50 mb-3" />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                        Queue Cleared: No {activeTab.replace('tier', 'Tier ')} tasks found.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <Table columns={columns} data={filteredUsers} />
                </div>
            )}

            {selectedUser && (
                <KYCDetailsModal
                    user={selectedUser}
                    isOpen={!!selectedUser}
                    activeTab={activeTab}
                    onClose={() => setSelectedUser(null)}
                    onApproveSuccess={() => handleApprove(selectedUser._id)}
                    onRejectSuccess={() => handleReject(selectedUser._id)}
                />
            )}
        </div>
    );

};

export default KYCReview;
